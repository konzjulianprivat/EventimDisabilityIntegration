import { useRequireAccess } from '../../../../hooks/useRequireAccess';
import { ADMIN_PERMISSIONS } from '../../../../adminPermissions';

export async function getServerSideProps(context) {
    return {
        redirect: {
            destination: '/admin/venues',   // where to send them
            permanent: false,    // 307 redirect (not cached as permanent)
        },
    };
}

export default function Index() {
    useRequireAccess(ADMIN_PERMISSIONS);
    return null;
}
