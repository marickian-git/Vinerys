// AI-009: Server-Sent Events pentru progresul operațiilor lungi (scanare). Fără EventSource:
// clientul face POST cu `Accept: text/event-stream` și citește corpul răspunsului pe bucăți.

export function wantsEventStream(request) {
  return (request.headers.get('accept') || '').includes('text/event-stream');
}

export function formatEvent(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// run(send) rulează operația; streamul se închide când promisiunea se termină
export function eventStreamResponse(run, headers = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (event, data) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(formatEvent(event, data)));
        } catch {
          open = false; // clientul a închis conexiunea; operația continuă (cache, consum AI)
        }
      };
      try {
        await run(send);
      } finally {
        if (open) controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // nginx: trimite evenimentele imediat
      ...headers,
    },
  });
}

// Parser incremental: primește text pe bucăți, întoarce evenimentele complete și restul
export function parseEventChunk(buffer) {
  const events = [];
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop();
  for (const block of blocks) {
    let event = 'message';
    const data = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (!data.length) continue;
    try {
      events.push({ event, data: JSON.parse(data.join('\n')) });
    } catch {
      // eveniment corupt: ignorat
    }
  }
  return { events, rest };
}
