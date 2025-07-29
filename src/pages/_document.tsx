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