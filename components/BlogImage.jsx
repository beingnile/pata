import Image from 'next/image'

export default function BlogImage({ src, alt, caption }) {
  return (
    <figure className="my-8">
      <div className="border-2 border-black overflow-hidden">
        <Image 
          src={src} 
          alt={alt}
          width={680}
          height={400}
          className="w-full h-auto"
        />
      </div>
      {caption && (
        <figcaption className="font-mono text-sm mt-2 text-center text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
