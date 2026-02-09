import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="font-mono text-7xl font-bold mb-4">PATA</h1>
        <p className="font-mono text-2xl mb-12">Tax tools for Kenyan freelancers</p>
        
        <div className="space-y-4">
          <Link 
            href="/blog"
            className="block bg-red-600 text-white font-mono text-lg px-12 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors uppercase"
          >
            Read the blog
          </Link>
          
          <p className="font-mono text-sm text-gray-400">Tool coming soon</p>
        </div>
      </div>
    </div>
  )
}
