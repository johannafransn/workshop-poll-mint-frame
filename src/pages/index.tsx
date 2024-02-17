import { SERVER_URL } from '@/utils'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <meta property="og:title" content="Frame" />
        <meta property="og:image" content={`${SERVER_URL}/question.png`} />
        <meta property="fc:frame" content="vNext" />
        <meta
          property="fc:frame:image"
          content={`${SERVER_URL}/question.png`}
        />
        <meta property="fc:frame:input:text" content="Type your answer" />
        <meta property="fc:frame:button:1" content="Submit ✉️" />
        <meta
          property="fc:frame:post_url"
          content={`${SERVER_URL}/api/post?data=start`}
        />
      </Head>
    </>
  )
}
