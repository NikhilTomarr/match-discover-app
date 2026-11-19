'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Home, Compass, Sparkles, MapPin, ArrowLeft } from 'lucide-react';

const cardVariants = {
  enter: { scale: 0.94, opacity: 0, y: 12 },
  center: {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
  exit: (direction) => ({
    x: direction === 'right' ? 480 : -480,
    rotate: direction === 'right' ? 22 : -22,
    opacity: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  }),
};

function SwipeCard({ profile, onSwipe, disabled }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (disabled) return;
    if (info.offset.x > 100 || info.velocity.x > 500) {
      onSwipe('right');
    } else if (info.offset.x < -100 || info.velocity.x < -500) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      key={profile.id}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ x, rotate }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 bg-white rounded-3xl border-2 border-black shadow-[6px_6px_0px_0px_#000] overflow-hidden flex flex-col cursor-grab select-none touch-none"
    >
      {/* Profile Photo */}
      <div className="relative flex-1 bg-gray-100 overflow-hidden">
        <img
          src={profile.photo}
          alt={profile.name}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
        />

        {/* Drag Feedback Badges */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-5 px-4 py-1.5 rounded-xl border-2 border-black bg-[#FF3D8B] text-white font-black text-xl tracking-wider -rotate-12 shadow-[3px_3px_0px_0px_#000]"
        >
          LIKE
        </motion.div>

        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-6 right-5 px-4 py-1.5 rounded-xl border-2 border-black bg-white text-black font-black text-xl tracking-wider rotate-12 shadow-[3px_3px_0px_0px_#000]"
        >
          PASS
        </motion.div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <h2 className="text-2xl font-extrabold leading-tight">
            {profile.name}, {profile.age}
          </h2>
          <p className="text-sm text-white/90 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {profile.city}
          </p>
        </div>
      </div>

      {/* Bio & Interests */}
      <div className="p-4 bg-white">
        <p className="text-sm text-gray-800 leading-snug mb-3">{profile.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {profile.interests?.map((interest) => (
            <span
              key={interest}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-gray-900 border border-black/15"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function CoyDiscoverApp() {
  const [activeTab, setActiveTab] = useState('Discover'); // 'Home' | 'Discover'
  const [showMatches, setShowMatches] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exitDirection, setExitDirection] = useState('right');
  const [swipeFeedback, setSwipeFeedback] = useState(null); // 'like' | 'pass' | null
  const [isSwiping, setIsSwiping] = useState(false);
  const [matchPopup, setMatchPopup] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [feedRes, matchesRes] = await Promise.all([
        fetch('/api/feed', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' }),
      ]);
      const [feedData, matchesData] = await Promise.all([
        feedRes.json(),
        matchesRes.json(),
      ]);
      setProfiles(Array.isArray(feedData) ? feedData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err) {
      console.error('Error loading Coy data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSwipe = useCallback(
    async (direction) => {
      if (isSwiping || profiles.length === 0) return;

      const currentProfile = profiles[0];
      const action = direction === 'right' ? 'like' : 'pass';

      setIsSwiping(true);
      setExitDirection(direction);
      setSwipeFeedback(action);

      // Remove card immediately for snappy animation
      setProfiles((prev) => prev.slice(1));

      setTimeout(() => {
        setSwipeFeedback(null);
      }, 450);

      try {
        const res = await fetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentProfile.id, action }),
        });
        const data = await res.json();

        if (data.isMatch && data.matchedProfile) {
          setMatchPopup(data.matchedProfile);
          setMatches((prev) => [data.matchedProfile, ...prev]);
        }
      } catch (err) {
        console.error('Swipe failed:', err);
      } finally {
        setTimeout(() => setIsSwiping(false), 220);
      }
    },
    [isSwiping, profiles]
  );

  // Desktop keyboard support (ArrowLeft = Pass, ArrowRight = Like)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (activeTab !== 'Discover' || showMatches || matchPopup) return;
      if (e.key === 'ArrowRight') handleSwipe('right');
      if (e.key === 'ArrowLeft') handleSwipe('left');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, showMatches, matchPopup, handleSwipe]);

  const activeProfile = profiles[0];

  return (
    <div className="min-h-screen bg-[#FAF8FA] text-black flex justify-center">
      {/* Mobile-First App Container */}
      <div className="w-full max-w-md min-h-screen bg-white sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem] sm:border-2 sm:border-black sm:shadow-[8px_8px_0px_0px_#000] flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <header className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-white z-20">
          <div className="flex items-center gap-2">
            {activeTab === 'Discover' && showMatches && (
              <button
                onClick={() => setShowMatches(false)}
                aria-label="Back to Discover"
                className="p-1.5 rounded-full hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-2xl font-black tracking-tight">
              coy<span className="text-[#FF3D8B]">.</span>
            </span>
          </div>

          {activeTab === 'Discover' && (
            <button
              onClick={() => setShowMatches((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold border-2 border-black transition shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 ${
                showMatches ? 'bg-[#FF3D8B] text-white' : 'bg-white text-black hover:bg-pink-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${showMatches ? 'fill-white' : 'fill-[#FF3D8B] text-[#FF3D8B]'}`} />
              <span>Matches</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs bg-black text-white">
                {matches.length}
              </span>
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Blank Home Tab */}
          {activeTab === 'Home' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                <Home className="w-7 h-7 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Home</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Placeholder tab for Coy&apos;s existing experience. Switch to the{' '}
                <button
                  onClick={() => setActiveTab('Discover')}
                  className="text-[#FF3D8B] font-bold underline"
                >
                  Discover
                </button>{' '}
                tab to swipe.
              </p>
            </div>
          )}

          {/* Discover Tab: Matches View */}
          {activeTab === 'Discover' && showMatches && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h1 className="text-xl font-black">Your Mutual Matches</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Only mutual likes appear here. Unmatched likes stay private.
                </p>
              </div>

              {matches.length === 0 ? (
                <div className="mt-14 text-center p-6 rounded-2xl border-2 border-dashed border-gray-200">
                  <Sparkles className="w-10 h-10 text-[#FF3D8B] mx-auto mb-3" />
                  <h3 className="font-bold text-gray-800">No matches yet</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Keep swiping right in Discover—when it&apos;s mutual, they&apos;ll show up here.
                  </p>
                  <button
                    onClick={() => setShowMatches(false)}
                    className="mt-4 px-5 py-2.5 rounded-full bg-[#FF3D8B] text-white font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000]"
                  >
                    Back to Discover
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3.5 p-3 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000]"
                    >
                      <img
                        src={match.photo}
                        alt={match.name}
                        className="w-16 h-16 rounded-xl object-cover border border-black shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-base truncate">
                          {match.name}, {match.age}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {match.city}
                        </p>
                        <p className="text-xs text-gray-700 mt-1 line-clamp-2">{match.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discover Tab: Swipe Deck */}
          {activeTab === 'Discover' && !showMatches && (
            <div className="flex-1 flex flex-col justify-between px-5 py-4">
              {/* Subtle Swipe Toast Feedback */}
              <div className="h-6 flex items-center justify-center mb-1">
                <AnimatePresence>
                  {swipeFeedback && (
                    <motion.span
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-xs font-extrabold px-3 py-0.5 rounded-full border border-black ${
                        swipeFeedback === 'like'
                          ? 'bg-[#FF3D8B] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {swipeFeedback === 'like' ? 'Liked!' : 'Passed'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Card Area (One profile card at a time) */}
              <div className="relative w-full h-[460px] mx-auto">
                {loading ? (
                  <div className="w-full h-full rounded-3xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                    <p className="text-sm font-semibold text-gray-500 animate-pulse">
                      Loading profiles...
                    </p>
                  </div>
                ) : !activeProfile ? (
                  /* Clear Empty State */
                  <div className="w-full h-full rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/70 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-pink-100 border-2 border-black flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-[#FF3D8B]" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">You&apos;re all caught up!</h2>
                    <p className="text-sm text-gray-500 mt-2">
                      No more profiles left in Discover right now. Check back later for new people.
                    </p>
                    <button
                      onClick={() => setShowMatches(true)}
                      className="mt-6 px-6 py-2.5 rounded-full bg-[#FF3D8B] text-white font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-y-0.5"
                    >
                      View Matches ({matches.length})
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="wait" custom={exitDirection}>
                    <SwipeCard
                      key={activeProfile.id}
                      profile={activeProfile}
                      onSwipe={handleSwipe}
                      disabled={isSwiping}
                    />
                  </AnimatePresence>
                )}
              </div>

              {/* Desktop & Mobile Action Buttons */}
              <div className="flex items-center justify-center gap-8 pt-4 pb-1">
                <button
                  onClick={() => handleSwipe('left')}
                  disabled={!activeProfile || isSwiping}
                  aria-label="Pass"
                  className="w-16 h-16 rounded-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-gray-800 hover:bg-gray-100 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <X className="w-8 h-8 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => handleSwipe('right')}
                  disabled={!activeProfile || isSwiping}
                  aria-label="Like"
                  className="w-16 h-16 rounded-full bg-[#FF3D8B] border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-white hover:brightness-105 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Heart className="w-8 h-8 fill-white" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Tab Bar (Home + Discover) */}
        <nav className="grid grid-cols-2 border-t-2 border-black bg-white z-20">
          <button
            onClick={() => {
              setActiveTab('Home');
              setShowMatches(false);
            }}
            className={`py-3 flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
              activeTab === 'Home' ? 'text-[#FF3D8B]' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('Discover')}
            className={`py-3 flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
              activeTab === 'Discover' ? 'text-[#FF3D8B]' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Discover</span>
          </button>
        </nav>

        {/* "It's a Match!" Fullscreen Overlay */}
        <AnimatePresence>
          {matchPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center text-white"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="w-full max-w-xs bg-white text-black rounded-3xl border-2 border-black p-6 shadow-[8px_8px_0px_0px_#FF3D8B]"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-[#FF3D8B] font-extrabold text-xs mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  MUTUAL LIKE
                </div>

                <h2 className="text-3xl font-black tracking-tight">It&apos;s a match!</h2>
                <p className="text-sm text-gray-600 mt-1">
                  You and <span className="font-bold text-black">{matchPopup.name}</span> both liked each other.
                </p>

                <img
                  src={matchPopup.photo}
                  alt={matchPopup.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#FF3D8B] mx-auto my-5 shadow-md"
                />

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setMatchPopup(null);
                      setShowMatches(true);
                    }}
                    className="w-full py-3 rounded-full bg-[#FF3D8B] text-white font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000]"
                  >
                    View Matches
                  </button>
                  <button
                    onClick={() => setMatchPopup(null)}
                    className="w-full py-3 rounded-full bg-white text-black font-bold text-sm border-2 border-black hover:bg-gray-50"
                  >
                    Keep Swiping
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}