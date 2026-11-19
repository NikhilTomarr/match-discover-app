import fs from 'fs';
import path from 'path';


export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const swipedIds = new Set(db.swipes.map((s) => s.id));

    // Privacy rule: strip hasLikedUser before sending to client
    const feed = db.profiles
      .filter((p) => !swipedIds.has(p.id))
      .map(({ hasLikedUser, ...publicProfile }) => publicProfile);

    return Response.json(feed);
  } catch (error) {
    return Response.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}