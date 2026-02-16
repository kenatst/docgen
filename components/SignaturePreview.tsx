import React, { useMemo } from "react";
import { ImageStyle, StyleProp } from "react-native";
import { Image } from "expo-image";
import { SvgXml } from "react-native-svg";

interface SignaturePreviewProps {
  uri: string;
  width: number | string;
  height: number | string;
  style?: StyleProp<ImageStyle>;
}

function extractSvgXml(uri: string): string | null {
  const prefix = "data:image/svg+xml;utf8,";
  if (!uri.startsWith(prefix)) {
    return null;
  }

  try {
    return decodeURIComponent(uri.slice(prefix.length));
  } catch {
    return null;
  }
}

export function SignaturePreview({ uri, width, height, style }: SignaturePreviewProps) {
  const svgXml = useMemo(() => extractSvgXml(uri), [uri]);

  if (svgXml) {
    return <SvgXml xml={svgXml} width={width} height={height} style={style} />;
  }

  return <Image source={{ uri }} style={style} contentFit="contain" />;
}
