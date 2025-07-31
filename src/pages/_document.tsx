import { Html, Head, Main, NextScript } from 'next/document'
import Document, { DocumentContext } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    // Only inject if we have the values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE || ''
    
    return (
      <Html lang="en">
        <Head>
          {/* PWA Meta Tags */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Flash Sales" />
          <meta name="application-name" content="Flash Sales Dashboard" />
          <meta name="theme-color" content="#00A86B" />
          <meta name="msapplication-TileColor" content="#00A86B" />
          <meta name="msapplication-tap-highlight" content="no" />
          <meta name="format-detection" content="telephone=no" />
          
          {/* iOS Splash Screens */}
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
          
          {/* Favicon */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
          
          {/* Only inject the script if we have environment variables */}
          {(supabaseUrl || supabaseKey) && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Injected by _document.tsx for runtime environment variables
                  if (typeof window !== 'undefined') {
                    window.NEXT_PUBLIC_SUPABASE_URL = "${supabaseUrl}";
                    window.NEXT_PUBLIC_SUPABASE_ANON_KEY = "${supabaseKey}";
                    window.NEXT_PUBLIC_USE_SUPABASE = "${useSupabase}";
                    window.NEXT_PUBLIC_APP_URL = "${process.env.NEXT_PUBLIC_APP_URL || ''}";
                    window.NEXT_PUBLIC_APP_ENV = "${process.env.NEXT_PUBLIC_APP_ENV || ''}";
                  }
                `,
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument