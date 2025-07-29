import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Inject environment variables into the window object */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Injected by _document.tsx for runtime environment variables
              window.NEXT_PUBLIC_SUPABASE_URL = "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}";
              window.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}";
              window.NEXT_PUBLIC_USE_SUPABASE = "${process.env.NEXT_PUBLIC_USE_SUPABASE || ''}";
              window.NEXT_PUBLIC_APP_URL = "${process.env.NEXT_PUBLIC_APP_URL || ''}";
              window.NEXT_PUBLIC_APP_ENV = "${process.env.NEXT_PUBLIC_APP_ENV || ''}";
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}