import { Link } from '@/shared/components/link';
import { Image } from '@/shared/components/image';
import type { ReactNode } from 'react';

export interface IHeaderProps {
    rightContent?: ReactNode;
}

export const Header: React.FC<IHeaderProps> = (props) => {
    const { rightContent } = props;

    return (
        <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-white/80 backdrop-blur border-b border-neutral-200">
            <div className="flex items-center gap-3">
                <Link href="/">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/static/media/harmony-logo.png"
                            alt="Harmony"
                            width={28}
                            height={28}
                            style={{ borderRadius: '50%' }}
                        />
                        <span className="font-semibold text-lg" style={{ color: 'var(--color-primary-600)' }}>
                            Community DAO
                        </span>
                    </div>
                </Link>
            </div>
            <div className="flex items-center gap-2">
                {rightContent}
                <Link href="/create/dao" className="btn-primary px-3 py-2">
                    Create DAO
                </Link>
            </div>
        </header>
    );
};
