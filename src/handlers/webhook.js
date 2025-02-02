import { constructGhReleasesGChatMessage, constructGChatUrl, constructPingGChatMessage } from '../utils/gchat'
import { postLog } from '../utils/logs'

export default async request => {
  try {
    const { headers, url } = request;
    const contentType = headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw '{"error": "wrong content-type"}';
    }
    const body = JSON.stringify(await request.json())
    const { zen, action, release, hook } = JSON.parse(body)
    const prefix_text = `An new releases was ${action}:`
    const gchatWebhookUrl = constructGChatUrl(url)
    let blocks;

    if (gchatWebhookUrl === null) {
      throw '{ "error": "error not enough params sent"}'
    }

    if (zen !== undefined) {
      blocks = constructPingGChatMessage(hook)
    } else if (action == "released") {
      blocks = constructGhReleasesGChatMessage(release, prefix_text)
    } else {
      const msg = `${action} - Not yet supported`
      const objRelease = JSON.stringify(release, (k, v) => v === undefined ? null : v)
      const objHook = JSON.stringify(hook, (k, v) => v === undefined ? null : v)
      await postLog(msg, `{"action": "${action}", "release": ${objRelease}, "hook": ${objHook}}`)
      return new Response(msg, { status: 500 })
    }

    let response = await fetch(gchatWebhookUrl, {
      body: JSON.stringify(blocks),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.status == 200) {
      return new Response('OK')
    } else {
      throw `${JSON.stringify(await response.json())}`
    }
  } catch (err) {
    await postLog('Error has been raised', err)
    return new Response(err, { status: 500 })
  }
}