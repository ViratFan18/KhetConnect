import { Link } from 'react-router-dom'

export default function ErrorPage({ title, message, buttonText = 'Go home', link = '/' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
        <span className="mb-4 block text-6xl">😔</span>
        <h1 className="mb-2 text-3xl font-semibold">{title}</h1>
        <p className="mb-6 max-w-md text-sm text-slate-300">{message}</p>
        <Link to={link} className="inline-flex rounded-2xl bg-cyan-500 px-6 py-3 text-white shadow-lg shadow-cyan-500/20">
          {buttonText}
        </Link>
      </div>
    </div>
  )
}
