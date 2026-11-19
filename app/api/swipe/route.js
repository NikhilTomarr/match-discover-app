import fs from 'fs';
import path from 'path';


export async function POST(req) {
  try {
    const { id, action } = await req.json();

    if (!id || !['like', 'pass'].includes(action)) {
      return Response.json({ error: 'Invalid swipe payload' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Prevent duplicate swipe on the same profile
    const alreadySwiped = db.swipes.some((s) => s.id === id);
    if (alreadySwiped) {
      return Response.json({ success: true, isMatch: false, duplicate: true });
    }

    const profile = db.profiles.find((p) => p.id === id);
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    db.swipes.push({
      id,
      action,
      timestamp: new Date().toISOString(),
    });

    let isMatch = false;
    let matchedProfile = null;

    if (action === 'like' && profile.hasLikedUser) {
      isMatch = true;
      const { hasLikedUser, ...publicProfile } = profile;
      matchedProfile = {
        ...publicProfile,
        matchedAt: new Date().toISOString(),
      };
      db.matches.unshift(matchedProfile);
    }

    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

    return Response.json({ success: true, isMatch, matchedProfile });
  } catch (error) {
    return Response.json({ error: 'Failed to record swipe' }, { status: 500 });
  }
}