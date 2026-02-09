import { getAllPosts } from '@/lib/blog'
import Link from 'next/link'

export const metadata = {
  title: 'Blog | Pata - Money, Finance & Tax Knowledge',
  description: 'Learn about money, finance, wealth building, and taxes.'
}

export default function BlogIndex() {
  const posts = getAllPosts()
  
  return (
    <div className="min-h-screen bg-white p-6 md:p-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="font-mono underline decoration-red-600 mb-8 inline-block">
          ← Back home
        </Link>
        
        <h1 className="font-mono text-5xl font-bold mb-2">PATA / BLOG</h1>
        <p className="font-mono text-lg mb-16">Money, finance, and tax knowledge</p>
        
        <div className="space-y-8">
          {posts.map(post => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="block border-2 border-black p-6 hover:bg-black hover:text-white transition-colors"
            >
              <h2 className="font-mono text-2xl font-bold mb-2">{post.title}</h2>
              <p className="font-mono mb-4">{post.excerpt}</p>
              <p className="font-mono text-sm">{post.date} • {post.readTime}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
