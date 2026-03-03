export async function GET() {
  return Response.json(
    { status: 'ok', app: 'vinerys', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}