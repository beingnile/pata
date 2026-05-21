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
    if (className !== undefined) {
      return <code className={`font-mono text-sm${className ? ` ${className}` : ''}`} {...props}>{children}</code>
    }
    return <code className="bg-red-600 text-white px-2 py-1 font-mono text-sm" {...props}>{children}</code>
  },
  pre: ({ children, ...props }) => {
    // Strip the leading newline MDX injects after the opening fence
    let content = children
    if (
      content?.props?.children &&
      typeof content.props.children === 'string' &&
      content.props.children.startsWith('\n')
    ) {
      content = {
        ...content,
        props: {
          ...content.props,
          children: content.props.children.replace(/^\n/, ''),
        },
      }
    }
    return (
      <pre className="bg-black text-white pt-4 pb-6 px-6 overflow-x-auto mb-6 font-mono text-sm leading-relaxed" {...props}>
        {content}
      </pre>
    )
  },
  blockquote: (props) => <blockquote className="border-l-4 border-red-600 pl-6 my-6 font-mono italic" {...props} />,
  // Tables styled to match the calculation breakdown blocks:
  // border-2 border-black outer shell, black header bar, divide-y-2 divide-black rows
  table: ({ children, ...props }) => (
    <div className="border-2 border-black mb-6 overflow-x-auto">
      <table className="font-mono w-full" {...props}>{children}</table>
    </div>
  ),
  thead: (props) => <thead className="bg-black text-white" {...props} />,
  tbody: (props) => <tbody className="divide-y-2 divide-black" {...props} />,
  tr: (props) => <tr {...props} />,
  th: (props) => <th className="p-4 text-left font-bold font-mono text-sm" {...props} />,
  td: (props) => <td className="p-4 font-mono text-sm" {...props} />,
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
