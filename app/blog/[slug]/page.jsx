import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import BlogImage from '@/components/BlogImage'
import CTAButton from '@/components/CTAButton'

const components = {
  BlogImage,
  CTAButton,
  h1: (props) => <h1 className="font-mono text-5xl font-bold mb-8 mt-12" {...props} />,
  h2: (props) => <h2 className="font-mono text-3xl font-bold mb-6 mt-10 border-b-4 border-red-600 inline-block" {...props} />,
  h3: (props) => <h3 className="font-mono text-2xl mb-4 mt-8" {...props} />,
  p: (props) => <p className="font-mono text-lg leading-relaxed mb-6" {...props} />,
  a: (props) => <a className="underline decoration-red-600 decoration-2 hover:bg-red-600 hover:text-white" {...props} />,
  ul: (props) => <ul className="font-mono text-lg mb-6 space-y-2" {...props} />,
  ol: (props) => <ol className="font-mono text-lg mb-6 space-y-2 list-decimal list-inside" {...props} />,
  li: (props) => <li className="ml-6" {...props} />,
  strong: (props) => <strong className="font-bold text-red-600" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  code: (props) => <code className="bg-red-600 text-white px-2 py-1 font-mono text-sm" {...props} />,
  pre: (props) => <pre className="bg-black text-white p-6 overflow-x-auto mb-6 font-mono text-sm" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-red-600 pl-6 my-6 font-mono italic" {...props} />,
  table: (props) => <div className="overflow-x-auto mb-6"><table className="font-mono w-full border-2 border-black" {...props} /></div>,
  thead: (props) => <thead className="bg-black text-white" {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr className="border-b border-black" {...props} />,
  th: (props) => <th className="p-4 text-left font-bold" {...props} />,
  td: (props) => <td className="p-4" {...props} />,
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  return {
    title: `${post.title} | Pata`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    }
  }
}

export default async function BlogPost({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-2xl mx-auto px-6 py-20">
        <Link href="/blog" className="font-mono underline decoration-red-600 mb-8 inline-block hover:bg-red-600 hover:text-white">
          ← Back to blog
        </Link>
        
        <h1 className="font-mono text-5xl font-bold mb-4">{post.title}</h1>
        <p className="font-mono text-sm mb-12 text-gray-600">
          {post.date} • {post.readTime}
        </p>
        
        <div className="prose-brutalist">
          <MDXRemote source={post.content} components={components} />
        </div>
        
        <div className="mt-16 border-t-2 border-black pt-8">
          <p className="font-mono text-sm text-gray-600">
            Written {post.date}
            {post.updated && post.updated !== post.date && <><br/>Updated {post.updated}</>}
          </p>
        </div>
      </article>
    </div>
  )
}
