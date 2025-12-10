import NextImage from 'next/image';
import type { ComponentProps } from 'react';

export interface IImageProps extends Omit<ComponentProps<'img'>, 'width' | 'height' | 'src'> {
    /**
     * Source of the image.
     */
    src?: string;
    /**
     * Width property for the NextJs image.
     */
    width?: number | `${number}`;
    /**
     * Height property for the NextJs image.
     */
    height?: number | `${number}`;
    /**
     * Defines if the image should fill its container.
     * @default true
     */
    fill?: boolean;
}

const buildNextImageProps = (
    src: string,
    alt: string,
    fill: boolean,
    sizes: IImageProps['sizes'],
    width: IImageProps['width'],
    height: IImageProps['height'],
    otherProps: Omit<IImageProps, 'src' | 'alt' | 'fill' | 'sizes' | 'width' | 'height'>,
) => {
    const processedSizes = sizes ?? (fill ? '50vw' : undefined);
    const w = typeof width === 'string' ? parseInt(width, 10) : width;
    const h = typeof height === 'string' ? parseInt(height, 10) : height;
    const hasFixedSize = w != null || h != null;

    if (hasFixedSize) {
        return { src, alt, width: w, height: h, ...otherProps } as const;
    }
    return { src, alt, fill, sizes: processedSizes, ...otherProps } as const;
};

export const Image: React.FC<IImageProps> = (props) => {
    const { src, alt = 'image', fill = true, sizes, width, height, ...otherProps } = props;
    if (src == null) return null;

    const nextImageProps = buildNextImageProps(src, alt, fill, sizes, width, height, otherProps);
    return <NextImage {...nextImageProps} />;
};
