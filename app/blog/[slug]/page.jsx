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
  // className is only present on block code (language-* or empty string from fenced blocks).
  // Inline code never receives a className from MDX — use that to distinguish.
  code: ({ children, className, ...props }) => {
    // className is only present on block code (language-* or empty string from fenced blocks).
    // Inline code never receives a className from MDX — use that to distinguish.
    if (className !== undefined) {
      return <code className={`font-mono text-sm${className ? ` ${className}` : ''}`} {...props}>{children}</code>
    }
    return <code className="bg-red-600 text-white px-2 py-1 font-mono text-sm" {...props}>{children}</code>
  },
  pre: ({ children, ...props }) => {
    // MDX can inject leading whitespace in several shapes. Normalise all of them.
    const stripLeading = (str) => typeof str === 'string' ? str.replace(/^[\n ]+/, '') : str

    const cleanCode = (codeEl) => {
      if (!codeEl?.props) return codeEl
      const c = codeEl.props.children
      if (typeof c === 'string') {
        return { ...codeEl, props: { ...codeEl.props, children: stripLeading(c) } }
      }
      if (Array.isArray(c)) {
        const cleaned = [stripLeading(c[0]), ...c.slice(1)]
        return { ...codeEl, props: { ...codeEl.props, children: cleaned } }
      }
      return codeEl
    }

    let content = children
    if (Array.isArray(children)) {
      // pre children is an array — drop any leading whitespace-only text nodes,
      // then clean the first code element
      const filtered = children.filter((c, i) => !(i === 0 && typeof c === 'string' && /^[\n ]+$/.test(c)))
      content = filtered.map((c, i) => i === 0 ? cleanCode(c) : c)
    } else {
      content = cleanCode(children)
    }

    return (
      <pre className="bg-black text-white pt-4 pb-6 px-6 overflow-x-auto mb-6 font-mono text-sm leading-relaxed" {...props}>
        {content}
      </pre>
    )
  },
  blockquote: (props) => <blockquote className="border-l-4 border-red-600 pl-6 my-6 font-mono italic" {...props} />,
  // Tables styled to match the calculation code blocks: black background, white text, monospace
  table: ({ children, ...props }) => (
    <div className="bg-black text-white mb-6 overflow-x-auto font-mono text-sm leading-relaxed">
      <table className="w-full" {...props}>{children}</table>
    </div>
  ),
  thead: (props) => <thead className="border-b-2 border-white" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: (props) => <tr {...props} />,
  th: (props) => <th className="px-6 pt-4 pb-3 text-left font-bold font-mono text-sm" {...props} />,
  td: (props) => <td className="px-6 py-2 font-mono text-sm" {...props} />,
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
