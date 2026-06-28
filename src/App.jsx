import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Monitor, Settings, Plus, Mic, CheckCircle2, RotateCcw, Clock, Trash2, Volume2 } from 'lucide-react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbymRfcrs1wV8FsT-O1yUinDZHXAuRpTBT8dlGQv4jRvTqlx7ZwsnX-NOARilgNjKXP9yA/exec";

// GET - baca data
const gasGet = async () => {
  try {
    const res = await fetch(GAS_URL + '?action=getAll', { redirect: 'follow' });
    const json = await res.json();
    return json.data || [];
  } catch(e) { return []; }
};

// POST via no-cors (GAS menerima form data)
const gasPost = (payload) => {
  const params = new URLSearchParams();
  Object.keys(payload).forEach(k => params.append(k, payload[k]));
  return fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
};

// --- KOMPONEN YOUTUBE ---
function CustomYouTube({ videoId, opts, onReady, onStateChange }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0]);
      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else if (window.YT?.Player) {
      setIsApiReady(true);
    }
    return () => { if (playerRef.current?.destroy) playerRef.current.destroy(); };
  }, []);

  useEffect(() => {
    if (isApiReady && containerRef.current && !playerRef.current) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: opts?.playerVars || { autoplay: 1, controls: 0, rel: 0, disablekb: 1, modestbranding: 1, mute: 1 },
        events: {
          onReady: (e) => {
            if (onReady) onReady({ target: e.target });
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e) => { if (onStateChange) onStateChange({ data: e.data }); }
        }
      });
    }
  }, [isApiReady]);

  useEffect(() => {
    if (playerRef.current?.loadVideoById) {
      try { playerRef.current.loadVideoById(videoId); } catch(e) {}
    }
  }, [videoId]);

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}

// --- KOMPONEN UTAMA ---
export default function App() {
  const [view, setView] = useState('home');
  if (view === 'display') return <DisplayView onBack={() => setView('home')} />;
  if (view === 'admin') return <AdminView onBack={() => setView('home')} />;

  const logoUrl = "https://i.ibb.co.com/mV7Qr7Fw/logo.png";
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center border-t-8 border-blue-600">
        <img src={logoUrl} alt="Logo" className="w-32 h-auto mx-auto mb-6 object-contain drop-shadow-md" onError={(e) => e.target.style.display='none'} />
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Sistem Antrian PPDB</h1>
        <h2 className="text-2xl font-semibold text-blue-600 mb-8">SMPN 23 Balikpapan</h2>
        <p className="text-slate-600 mb-10">Silakan pilih mode tampilan. Admin dan Layar Murid bisa dibuka di device berbeda.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setView('admin')} className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border-2 border-blue-200 group">
            <div className="bg-blue-600 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform"><Settings size={32} /></div>
            <span className="text-xl font-bold text-slate-800">Panel Petugas</span>
            <span className="text-sm text-slate-500 mt-2">Kelola antrian & panggil</span>
          </button>
          <button onClick={() => setView('display')} className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors border-2 border-indigo-200 group">
            <div className="bg-indigo-600 p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform"><Monitor size={32} /></div>
            <span className="text-xl font-bold text-slate-800">Layar Murid</span>
            <span className="text-sm text-slate-500 mt-2">Tampilan TV & Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- LAYAR DISPLAY ---
function DisplayView({ onBack }) {
  const [queues, setQueues] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [runningText, setRunningText] = useState("🚀 Selamat Datang di PPDB SMPN 23 Balikpapan 🚀 Siapkan berkas pendaftaran Anda");
  const [playlist, setPlaylist] = useState(['Jlyt4bCoiJk']);
  const [currentVidIndex, setCurrentVidIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // State untuk Volume
  const [vidVolume, setVidVolume] = useState(100);
  const vidVolumeRef = useRef(100);

  const playerRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const logoUrl = "https://i.ibb.co.com/mV7Qr7Fw/logo.png";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVolumeChange = (newVolume) => {
    setVidVolume(newVolume);
    vidVolumeRef.current = newVolume;
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const playCallAudio = useCallback((callData) => {
    if (!('speechSynthesis' in window)) return;
    
    // Batalkan suara yang sedang berjalan jika ada
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Kecilkan volume YouTube saat panggilan masuk
    try { if (playerRef.current?.setVolume) playerRef.current.setVolume(15); } catch(e) {}
    
    const spelledNumber = String(callData.number).split('').join(' ');
    
    // Buat kalimat tunggal
    const singleCall = `Nomor antrian, ${spelledNumber}, silakan menuju loket, ${callData.loket}`;
    
    // Gabungkan menjadi 2 kali panggilan berturut-turut dalam satu instruksi suara
    // Tambahkan titik (.) di tengah agar ada jeda natural sebelum pengulangan
    const utterance = new SpeechSynthesisUtterance(`${singleCall}. ${singleCall}`);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85;
    
    // Kembalikan ke volume yang diatur user setelah panggilan selesai
    utterance.onend = () => { try { if (playerRef.current?.setVolume) playerRef.current.setVolume(vidVolumeRef.current); } catch(e) {} };
    // Fallback timer diperpanjang menjadi 15 detik (15000ms) karena suara sekarang diputar 2x
    setTimeout(() => { try { if (playerRef.current?.setVolume) playerRef.current.setVolume(vidVolumeRef.current); } catch(e) {} }, 15000);
    
    // Beri jeda waktu 150ms sebelum memulai suara baru
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 150);
  }, []);

  useEffect(() => {
    if (!isStarted) return;
    const poll = async () => {
      const data = await gasGet();
      setQueues(data.map(r => ({ id: String(r.id), number: r.number, status: r.status, loket: r.loket, timestamp: r.timestamp })));

      // Urutkan berdasarkan waktu panggilan (yang terbaru di atas)
      const called = data.filter(r => r.status === 'called').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (called.length > 0) {
        const latest = called[0];
        const latestTime = new Date(latest.timestamp).getTime();

        // 1. KASUS AWAL LOAD/RELOAD: 
        if (lastTimestampRef.current === null) {
          lastTimestampRef.current = latestTime;
          setCurrentCall({ number: latest.number, loket: latest.loket });
          return;
        }

        // 2. KASUS PANGGILAN BARU / ULANGI: 
        if (latestTime > lastTimestampRef.current) {
          lastTimestampRef.current = latestTime;
          const callData = { number: latest.number, loket: latest.loket };
          setCurrentCall(callData);
          playCallAudio(callData);
        } 
        // 3. KASUS DIHAPUS: 
        else if (latestTime < lastTimestampRef.current) {
          lastTimestampRef.current = latestTime;
          setCurrentCall({ number: latest.number, loket: latest.loket });
        }

      } else {
        // Jika data benar-benar kosong (Semua dihapus)
        if (lastTimestampRef.current !== null) {
          lastTimestampRef.current = null;
          setCurrentCall(null);
        }
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isStarted, playCallAudio]);

  const onReady = (e) => {
    playerRef.current = e.target;
    try { 
      e.target.unMute(); 
      e.target.setVolume(vidVolumeRef.current); 
      e.target.playVideo(); 
    } catch(err) {}
  };

  const onStateChange = (e) => {
    if (e.data === 0) {
      if (playlist.length > 1) setCurrentVidIndex(p => (p + 1) % playlist.length);
      else { try { playerRef.current?.seekTo(0); playerRef.current?.playVideo(); } catch(e) {} }
    }
  };

  const getLastCalled = (loketNum) => {
    const called = queues.filter(q => q.status === 'called' && String(q.loket) === String(loketNum));
    return called.length ? called[called.length - 1].number : '---';
  };

  const opts = { playerVars: { autoplay: 1, controls: 0, rel: 0, disablekb: 1, modestbranding: 1, mute: 1, loop: 1 } };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-hidden relative">
      {!isStarted && (
        <div className="absolute inset-0 bg-slate-900 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl text-center max-w-md shadow-2xl">
            <Monitor size={64} className="mx-auto text-blue-600 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Mulai Tampilan Layar</h2>
            <p className="text-slate-600 mb-8">Klik tombol di bawah untuk memulai layar dan suara antrean.</p>
            <button onClick={() => {
              setIsStarted(true);
              setTimeout(() => {
                try { if (playerRef.current?.unMute) { playerRef.current.unMute(); playerRef.current.setVolume(vidVolumeRef.current); playerRef.current.playVideo(); } } catch(e) {}
              }, 500);
            }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3">
              <Play size={24} /> Mulai Layar & Suara
            </button>
            <button onClick={onBack} className="mt-4 text-slate-500 hover:text-slate-700 text-sm">Kembali ke Menu Utama</button>
          </div>
        </div>
      )}
      <header className="bg-blue-700 text-white p-3 shadow-lg flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-wide">PPDB SMPN 23 BALIKPAPAN</h1>
            <p className="text-blue-100 text-xs font-medium">Tahun Ajaran 2026/2027</p>
          </div>
        </div>
        <div className="flex flex-col items-end bg-blue-800 px-4 py-2 rounded-xl border border-blue-600 shadow-inner">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-300" />
            <div className="text-2xl font-bold font-mono tracking-wider">{currentTime.toLocaleTimeString('id-ID', { hour12: false })}</div>
          </div>
          <div className="text-blue-200 text-xs font-medium mt-0.5 tracking-wide uppercase">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>
      <main className="flex-1 flex p-3 gap-3 overflow-hidden">
        <div className="w-2/3 flex flex-col gap-3 relative">
          <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-xl relative border-4 border-slate-300 group">
            <div className="absolute inset-0 w-full h-full bg-black">
              {playlist.length > 0
                ? <CustomYouTube videoId={playlist[currentVidIndex]} opts={opts} onReady={onReady} onStateChange={onStateChange} />
                : <div className="flex items-center justify-center h-full text-slate-500 text-sm">Playlist Kosong</div>
              }
            </div>
            
            {/* Indikator Video */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 backdrop-blur-sm z-10 pointer-events-none">
              <Monitor size={14} /> Memutar Video ({currentVidIndex + 1}/{Math.max(1, playlist.length)})
            </div>

            {/* Slider Pengatur Volume Custom (Terlihat saat dihover) */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 z-20 opacity-50 hover:opacity-100 transition-opacity">
              <Volume2 size={20} className="text-white" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={vidVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 accent-blue-500 cursor-pointer"
                title="Atur Volume Video"
              />
              <span className="text-white text-xs font-mono w-6">{vidVolume}%</span>
            </div>

          </div>
        </div>
        <div className="w-1/3 flex flex-col gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 shadow-xl text-center text-white flex flex-col justify-center items-center relative overflow-hidden border-4 border-indigo-400">
            <div className="absolute -right-10 -top-10 text-white/10"><Mic size={120} /></div>
            <h2 className="text-lg font-bold mb-1 uppercase tracking-widest text-indigo-200">Panggilan Saat Ini</h2>
            <div className="text-6xl font-black tracking-tighter my-2 drop-shadow-lg">{currentCall ? currentCall.number : '---'}</div>
            <div className="bg-white/20 px-5 py-1.5 rounded-full backdrop-blur-sm text-lg font-bold border border-white/30 z-10">LOKET {currentCall ? currentCall.loket : '-'}</div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {[1, 2, 3].map(loket => (
              <div key={loket} className="flex-1 bg-white rounded-2xl p-3 flex items-center shadow-md border border-slate-200">
                <div className="bg-amber-500 w-16 h-full rounded-xl flex items-center justify-center flex-col text-white">
                  <span className="text-xs font-bold uppercase opacity-80">Loket</span>
                  <span className="text-3xl font-black">{loket}</span>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-0.5">Antrian Terakhir</span>
                  <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tighter">{getLastCalled(loket)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="bg-slate-800 text-white py-2 overflow-hidden border-t-4 border-amber-500 z-10">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] inline-block text-lg font-medium tracking-wide">{runningText}</div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes marquee{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}`}} />
      </footer>
    </div>
  );
}

// --- PANEL ADMIN ---
function AdminView({ onBack }) {
  const [queues, setQueues] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [textInput, setTextInput] = useState("🚀 Selamat Datang di PPDB SMPN 23 Balikpapan 🚀 Siapkan berkas pendaftaran Anda");
  const [playlist, setPlaylist] = useState(['Jlyt4bCoiJk']);
  const [ytInput, setYtInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Menghubungkan...');

  const fetchQueues = async () => {
    const data = await gasGet();
    if (data) {
      setQueues(data.map(r => ({ id: String(r.id), number: r.number, status: r.status, loket: r.loket, timestamp: r.timestamp })));
      setSyncStatus('Terhubung ✓');
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddQueue = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setLoading(true);
    const newQueue = {
      action: 'create',
      id: Date.now().toString(),
      number: inputValue.trim().toUpperCase(),
      status: 'pending',
      loket: '',
      timestamp: new Date().toISOString()
    };
    setQueues(prev => [...prev, { ...newQueue }]);
    setInputValue('');
    await gasPost(newQueue);
    setTimeout(fetchQueues, 1500);
    setLoading(false);
  };

  const handleCallQueue = async (queueId, loketNumber) => {
    const updatedTimestamp = new Date().toISOString();
    setQueues(prev => prev.map(q => q.id === queueId ? { ...q, status: 'called', loket: loketNumber, timestamp: updatedTimestamp } : q));
    await gasPost({ action: 'update', id: queueId, loket: loketNumber, timestamp: updatedTimestamp });
    setTimeout(fetchQueues, 1500);
  };

  const handleRecall = async (queue) => {
    const newTimestamp = new Date().toISOString();
    setQueues(prev => prev.map(q => q.id === queue.id ? { ...q, timestamp: newTimestamp } : q));
    await gasPost({ action: 'update', id: queue.id, loket: queue.loket, timestamp: newTimestamp });
    setTimeout(fetchQueues, 1500);
  };

  const handleDelete = async (queueId) => {
    setQueues(prev => prev.filter(q => q.id !== queueId));
    await gasPost({ action: 'delete', id: queueId });
    setTimeout(fetchQueues, 1500);
  };

  const extractYtId = (url) => {
    let id = url.trim();
    if (id.includes('youtube.com') || id.includes('youtu.be')) {
      try {
        const parsed = new URL(id);
        id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : (parsed.searchParams.get('v') || id);
      } catch(e) {}
    }
    return id.length === 11 ? id : null;
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    let newPlaylist = [...playlist];
    let count = 0;
    ytInput.split(',').forEach(url => {
      const id = extractYtId(url);
      if (id && !newPlaylist.includes(id)) { newPlaylist.push(id); count++; }
    });
    if (!count) return alert("URL YouTube tidak valid!");
    setPlaylist(newPlaylist);
    setYtInput('');
  };

  const pendingQueues = queues.filter(q => q.status === 'pending');
  const calledQueues = queues.filter(q => q.status === 'called').sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">&larr; Kembali</button>
          <div className="h-6 w-px bg-slate-300"></div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings className="text-blue-600" size={24} /> Panel Admin</h1>
        </div>
        <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> {syncStatus}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-500" /> Input Nomor</h2>
            <form onSubmit={handleAddQueue} className="flex gap-3">
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                placeholder="Contoh: A001"
                className="flex-1 bg-slate-50 border border-slate-300 text-lg rounded-xl focus:ring-blue-500 block p-3 uppercase font-mono" required />
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md disabled:opacity-50">
                {loading ? '...' : 'Tambah'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Daftar Tunggu</span>
              <span className="bg-amber-100 text-amber-700 text-xs py-1 px-3 rounded-full font-bold">{pendingQueues.length} Antrian</span>
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
              {pendingQueues.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Belum ada antrian</p>}
              {pendingQueues.map(q => (
                <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-mono text-2xl font-black text-slate-700">{q.number}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(loket => (
                      <button key={loket} onClick={() => handleCallQueue(q.id, loket)}
                        className="bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-2 px-4 rounded-lg transition-colors border border-blue-200">
                        L{loket}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Settings size={16} className="text-amber-500" /> Teks Bawah Layar (Running Text)</h2>
              <div className="flex gap-2">
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                  placeholder="Masukkan teks pengumuman..."
                  className="flex-1 bg-slate-50 border border-slate-300 text-sm rounded-lg block p-2.5" />
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg text-sm">Ubah Teks</button>
              </div>
            </div>
            <hr className="border-slate-100" />
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2"><Play size={16} className="text-red-500" /> Antrian Playlist Video YouTube</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{playlist.length} Video</span>
              </h2>
              <form onSubmit={handleAddVideo} className="flex gap-2 mb-3">
                <input type="text" value={ytInput} onChange={e => setYtInput(e.target.value)}
                  placeholder="Link YouTube (Bisa banyak, pisah koma)"
                  className="flex-1 bg-slate-50 border border-slate-300 text-sm rounded-lg block p-2.5" required />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm"><Plus size={16}/> Tambah</button>
              </form>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {playlist.map((videoId, index) => (
                  <div key={videoId} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-400">{index + 1}.</span>
                    <img src={`https://img.youtube.com/vi/${videoId}/default.jpg`} alt="thumb" className="w-12 h-9 object-cover rounded" />
                    <span className="flex-1 font-mono text-sm text-slate-700">{videoId}</span>
                    <button onClick={() => setPlaylist(p => p.filter(v => v !== videoId))} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Riwayat</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs py-1 px-3 rounded-full font-bold">{calledQueues.length} Selesai</span>
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {calledQueues.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div>
                    <div className="font-mono text-xl font-bold text-slate-800">{q.number}</div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> Loket {q.loket}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRecall(q)} className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 py-2 px-3 rounded-lg border border-slate-300 shadow-sm text-sm">
                      <RotateCcw size={16} /> Ulangi
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="flex items-center bg-white hover:bg-red-50 text-red-600 py-2 px-3 rounded-lg border border-red-200 shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
