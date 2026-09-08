import Link from "next/link";

export default function OfflinePage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 text-center text-slate-950"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Offline</p><h1 className="mt-2 text-3xl font-black">Your diary is still available.</h1><p className="mt-3 text-slate-600">Records saved on this device remain available without internet.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Back to Diary</Link></div></main>;
}
