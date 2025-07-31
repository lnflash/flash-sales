"use client";

import React, { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import { Submission } from "@/types/submission";
import { getSubmissions } from "@/lib/api";
import { getUserFromStorage } from "@/lib/auth";
import { hasPermission } from "@/types/roles";

interface SubmissionSearchProps {
  onSelect: (submission: Submission) => void;
  onClear: () => void;
  currentSubmissionId?: string;
}

export default function SubmissionSearch({ onSelect, onClear, currentSubmissionId }: SubmissionSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Submission[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Get current user for filtering
  const user = getUserFromStorage();
  const canViewAllSubmissions = user?.role && hasPermission(user.role, 'canViewAllReps');

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Build filters based on user permissions
        const filters: any = { search: debouncedSearch };
        
        // If user can't view all submissions, filter by their username
        if (!canViewAllSubmissions && user?.username) {
          filters.username = user.username;
        }

        const response = await getSubmissions(
          filters,
          { pageIndex: 0, pageSize: 10 }
        );
        
        // Filter out the current submission if in edit mode
        const filteredResults = currentSubmissionId 
          ? response.data.filter(s => s.id !== currentSubmissionId)
          : response.data;
          
        setSearchResults(filteredResults);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch, canViewAllSubmissions, user?.username, currentSubmissionId]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (submission: Submission) => {
    onSelect(submission);
    setSearchQuery(submission.ownerName);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    onClear();
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-light-text-tertiary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Search existing submissions..."
          className="w-full pl-10 pr-10 py-2 bg-white text-light-text-primary rounded-md border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-light-text-tertiary hover:text-light-text-secondary" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-light-border max-h-60 overflow-auto">
          {isSearching ? (
            <div className="p-4 text-center text-light-text-secondary">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-flash-green"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="py-1">
              {searchResults.map((submission, index) => (
                <li
                  key={submission.id}
                  onClick={() => handleSelect(submission)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-flash-green bg-opacity-10"
                      : "hover:bg-light-bg-secondary"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-light-text-primary">
                        {submission.ownerName}
                      </p>
                      <p className="text-sm text-light-text-secondary">
                        {submission.phoneNumber || "No phone"} • {submission.territory || "No territory"}
                      </p>
                      <p className="text-xs text-light-text-tertiary mt-1">
                        Lead Status: {submission.leadStatus || "Not set"} • 
                        Interest: {submission.interestLevel}/5 • 
                        Rep: {submission.username}
                      </p>
                    </div>
                    <div className="ml-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        submission.signedUp 
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {submission.signedUp ? "Signed Up" : "Prospect"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : debouncedSearch.trim().length >= 2 ? (
            <div className="p-4 text-center text-light-text-secondary">
              <p className="text-sm">No submissions found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}