import { sql } from '@vercel/postgres'

import { syndicate } from './config'
import { TPostData, TUntrustedData } from './types'
import { createMintClient } from '@zoralabs/protocol-sdk'
import { Address, createWalletClient, PublicClient, WalletClient } from 'viem'
export const SERVER_URL = process.env.SERVER_URL

// generate an html page with the relevant opengraph tags
export function generateFarcasterFrame(image: string, postData: TPostData) {
  let metaTags = ''

  switch (postData) {
    case 'mint':
      metaTags += `
		  <meta property="fc:frame:image" content="${image}" />
		  <meta property="fc:frame:button:1" content="Mint Johannas NFT ✨" />`
      break
    case 'redirect':
      metaTags += `
		  <meta property="fc:frame:image" content="${image}" />
		  <meta property="fc:frame:button:1" content="Github" />
		  <meta property="fc:frame:button:1:action" content="post_redirect" />`
      break
    case 'error':
      metaTags += `
		<meta property="fc:frame:image" content="${image}" />
		<meta property="fc:frame:button:1" content="Follow me for the next release" />
		<meta property="fc:frame:button:1:action" content="post_redirect" />`
      break
  }

  const postUrl = `${SERVER_URL}/api/post?data=${postData}`

  return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta property="fc:frame" content="vNext" />
		${metaTags}
		<meta property="fc:frame:post_url" content="${postUrl}" />
	  </head>
	  <body>
	  </body>
	  </html>
	`
}

export async function saveTextInput(ud: TUntrustedData) {
  const isMintedAndRowCount =
    await sql`SELECT COUNT(*) AS rowCount, bool_or(isMinted) AS isMinted
	FROM "Feedback" 
	WHERE Fid = ${ud.fid};`

  // @dev limit token issuance up to is minted
  if (isMintedAndRowCount.rows[0].isminted) {
    console.log('Fid already minted:', ud.fid)
    return generateFarcasterFrame(`${SERVER_URL}/error.png`, 'error')
  } else {
    await sql`INSERT INTO "Feedback" (Fid, Text, Isminted) VALUES (${ud.fid}, ${ud.inputText}, false);`
    return generateFarcasterFrame(`${SERVER_URL}/mint.png`, 'mint')
  }
}

export async function mintWithSyndicate(fid: number) {
  /* const syndicateMintTx = await syndicate.transact.sendTransaction({
    projectId: process.env.PROJECT_ID || '',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    chainId: 84532,
    functionSignature: 'mint(address to)',
    args: {
      to: await getAddrByFid(fid),
    },
  }) */

  console.log('Syndicate Transaction ID: ')
  await sql`UPDATE "Feedback" SET Isminted = true WHERE Fid = ${fid};`

  //@todo loading frame so that nft has time to mint
  return generateFarcasterFrame(`${SERVER_URL}/redirect.png`, 'redirect')
}

async function getAddrByFid(fid: number): Promise<string | void> {
  console.log('Extracting address for FID: ', fid)

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  }

  try {
    // Searchcaster API
    const resp = await fetch(
      `https://searchcaster.xyz/api/profiles?fid=${fid}`,
      options
    )
    if (!resp.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await resp.json()

    // Extract connected address if available, otherwise use address from body
    const connectedAddress = data[0]?.connectedAddress || data[0]?.body.address
    console.log('Connected address:', connectedAddress)

    return connectedAddress
  } catch (error) {
    return console.error('Error fetching profile data:', error)
  }
}
