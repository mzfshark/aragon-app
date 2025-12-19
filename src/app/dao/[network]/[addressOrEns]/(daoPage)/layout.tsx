import { LayoutDao } from '@/modules/application/components/layouts/layoutDao';
import { applicationMetadataUtils } from '@/modules/application/utils/applicationMetadataUtils';

export const generateMetadata = applicationMetadataUtils.generateDaoMetadata;

// Ensure SSR runs on Node.js (not Edge) so it can reach backends on HTTP/custom ports.
export const runtime = 'nodejs';

export default LayoutDao;
