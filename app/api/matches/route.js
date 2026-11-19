import fs from 'fs';
import path from 'path';


export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const safeMatches = db.matches.map(({ hasLikedUser, ...publicProfile }) => publicProfile);
    return Response.json(safeMatches);
  } catch (error) {
    return Response.json({ error: 'Failed to load matches' }, { status: 500 });
  }
}