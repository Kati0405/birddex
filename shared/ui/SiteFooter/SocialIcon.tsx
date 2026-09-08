type SocialIconProps = {
  src: string;
  size?: number;
};

export default function SocialIcon({ src, size = 20 }: SocialIconProps) {
  return (
    <span
      aria-hidden="true"
      className="block bg-current"
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
