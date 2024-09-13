import type {InferType} from 'groqd';

import type {SETTINGS_FRAGMENT} from '~/qroq/fragments';

import {useSanityRoot} from '~/hooks/useSanityRoot';

import {SanityImage} from '../sanity/SanityImage';

import asciiLogo from '~/lib/asciiLogos'
import { useEffect, useMemo, useState } from 'react';
type Logo = InferType<typeof SETTINGS_FRAGMENT.logo>;

export function Logo(props: {
  className?: string;
  loading?: 'eager' | 'lazy';
  sanityEncodeData?: string;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  const {data, encodeDataAttribute} = useSanityRoot();
  const sanitySettings = data?.settings;
  const logo = sanitySettings?.logo;
  const siteName = sanitySettings?.siteName;
  const [logoResolution, setLogoResolution] = useState(0)
  const [logoOpacity, setLogoOpacity] = useState(49)
  const [logoShouldDarken, setLogoDarken] = useState(false)
  useEffect(()=>{
    const intId = setInterval(()=>{
      //setLogoResolution((logoResolution +1)%3)
      if(!((logoOpacity + (logoShouldDarken ? 1 : -1))% 46)){
        setLogoDarken(!logoShouldDarken)
      }
      setLogoOpacity(logoOpacity + (logoShouldDarken ? 1 : -1))
    },111)
      return ()=>clearInterval(intId)
    })
  
  if (!logo?._ref) {
    return (
      <div className="flex  items-center justify-center font-heading text-[6px] notouch:group-hover:decoration-dashed decoration-black">
        <AsciiLogo resolution={2} opacity={46 - logoOpacity} />
      </div>
    );
  }

  const encodeData = encodeDataAttribute([
    // Path to the logo image in Sanity Studio
    'settings',
    'logo',
    '_ref',
    logo._ref,
  ]);

  return (
    <SanityImage
      data={{
        ...logo,
        alt: siteName || '',
      }}
      dataSanity={encodeData}
      {...props}
    />
  );
}
const AsciiLogo = (props: {
  className ? : string,
  resolution?: number,
  opacity?:number
}) =>{
  let {className, resolution, opacity} = props
  resolution = resolution || 0
  opacity = opacity || 0
  const logo = asciiLogo[resolution ][opacity]

  return <pre>
    {logo}
  </pre>
}