"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gql, useApolloClient } from "@apollo/client";
import { saveUserToStorage } from "@/lib/auth";
import { PinAuthService } from "@/services/pin-auth";
import LoginForm from "@/components/auth/LoginForm";
import PinVerification from "@/components/auth/PinVerification";
import PinSetup from "@/components/auth/PinSetup";
import { supabase } from "@/lib/supabase/client";

// GraphQL query for username verification
const CHECK_USERNAME_QUERY = gql`
  query accountDefaultWallet($username: Username!) {
    accountDefaultWallet(username: $username, walletCurrency: USD) {
      __typename
      id
      walletCurrency
    }
  }
`;

type LoginStep = "username" | "pin-setup" | "pin-verify";

export default function LoginV2() {
  const [step, setStep] = useState<LoginStep>("username");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [graphqlUserId, setGraphqlUserId] = useState(""); // Store the GraphQL user ID
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>();
  const [lockedUntil, setLockedUntil] = useState<Date | undefined>();
  const router = useRouter();
  const client = useApolloClient();

  // Check if user has PIN setup
  const checkUserPinStatus = async (username: string): Promise<boolean> => {
    try {
      // First check if user exists in our database
      const { data: userData } = await supabase.from("users").select("id, pin_hash").eq("email", `${username}@flash.co`).single();

      if (!userData) {
        // User doesn't exist in our database yet, create them
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: `${username}@flash.co`,
            first_name: username,
            last_name: "User",
            role: "sales_rep",
            // Add PIN columns with defaults to avoid errors
            pin_hash: null,
            pin_attempts: 0,
            pin_locked_until: null,
            pin_required: true,
          })
          .select("id")
          .single();

        if (createError) {
          // If user already exists (duplicate key error), try to fetch them
          if (createError.code === "23505") {
            const { data: existingUser } = await supabase.from("users").select("id, pin_hash").eq("email", `${username}@flash.co`).single();

            if (existingUser) {
              setUserId(existingUser.id);
              return !!existingUser.pin_hash;
            }
          }
          console.error("Error creating user:", createError);
          return false;
        }

        setUserId(newUser.id);
        return false; // New user, no PIN
      }

      setUserId(userData.id);
      return !!userData.pin_hash;
    } catch (error) {
      console.error("Error checking PIN status:", error);
      return false;
    }
  };

  const handleUsernameSubmit = async (submittedUsername: string) => {
    try {
      // Try to verify username with GraphQL
      let userId = "";
      let skipGraphQL = false;

      // Check if we're in development mode without GraphQL
      if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_GRAPHQL_URI) {
        console.warn("GraphQL URI not configured, using development mode");
        skipGraphQL = true;
        // Generate a mock user ID for development
        userId = `dev-${submittedUsername}`;
      } else {
        try {
          const { data } = await client.query({
            query: CHECK_USERNAME_QUERY,
            variables: { username: submittedUsername },
            fetchPolicy: "network-only",
          });

          if (!data?.accountDefaultWallet?.id) {
            return false;
          }

          userId = data.accountDefaultWallet.id;
        } catch (graphqlError) {
          // If GraphQL fails in development, allow bypass
          if (process.env.NODE_ENV === "development") {
            console.warn("GraphQL verification failed, using development bypass");
            skipGraphQL = true;
            userId = `dev-${submittedUsername}`;
          } else {
            throw graphqlError;
          }
        }
      }

      setUsername(submittedUsername);
      setGraphqlUserId(userId); // Store the GraphQL user ID

      // Check if user has PIN setup
      const hasPinSetup = await checkUserPinStatus(submittedUsername);

      if (hasPinSetup) {
        setStep("pin-verify");
      } else {
        setStep("pin-setup");
      }

      return true;
    } catch (error) {
      console.error("Username verification error:", error);
      return false;
    }
  };

  const handlePinSetup = async (pin: string): Promise<boolean> => {
    try {
      const result = await PinAuthService.setupPin(userId, pin);

      if (result.success) {
        // Save user to storage and redirect
        saveUserToStorage({
          username,
          userId: graphqlUserId, // Use the GraphQL user ID
          loggedInAt: Date.now(),
        });

        router.push("/dashboard");
        return true;
      }

      return false;
    } catch (error) {
      console.error("PIN setup error:", error);
      return false;
    }
  };

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    try {
      const result = await PinAuthService.verifyUserPin(userId, pin);

      if (result.success) {
        // Save user to storage and redirect
        saveUserToStorage({
          username,
          userId: graphqlUserId, // Use the GraphQL user ID
          loggedInAt: Date.now(),
        });

        router.push("/dashboard");
        return true;
      }

      // Update attempt information
      setAttemptsRemaining(result.attemptsRemaining);
      setLockedUntil(result.lockedUntil);

      return false;
    } catch (error) {
      console.error("PIN verification error:", error);
      return false;
    }
  };

  const handlePinSkip = () => {
    // Allow skip for now, but mark user as needing PIN setup
    saveUserToStorage({
      username,
      userId,
      loggedInAt: Date.now(),
    });

    router.push("/dashboard");
  };

  const handleForgotPin = () => {
    // Redirect to PIN reset flow
    router.push(`/reset-pin?email=${username}@flash.co`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-surface to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === "username" && <LoginForm onSubmit={handleUsernameSubmit} />}

        {step === "pin-setup" && <PinSetup onSetup={handlePinSetup} onSkip={handlePinSkip} />}

        {step === "pin-verify" && (
          <PinVerification
            onVerify={handlePinVerify}
            onForgotPin={handleForgotPin}
            onCancel={() => setStep("username")}
            attemptsRemaining={attemptsRemaining}
            lockedUntil={lockedUntil}
          />
        )}
      </div>
    </div>
  );
}
