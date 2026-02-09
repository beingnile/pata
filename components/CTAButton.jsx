import Link from 'next/link'

export default function CTAButton({ text, href }) {
  return (
    <div className="my-12 text-center">
      <Link 
        href={href}
        className="inline-block bg-red-600 text-white font-mono text-lg px-12 py-4 border-2 border-black hover:bg-black transition-colors uppercase"
      >
        {text}
      </Link>
    </div>
  )
}
