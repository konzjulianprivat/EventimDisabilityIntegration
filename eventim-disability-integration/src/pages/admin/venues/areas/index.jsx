export async function getServerSideProps(context) {
    return {
        redirect: {
            destination: '/admin/venues',   // where to send them
            permanent: false,    // 307 redirect (not cached as permanent)
        },
    };
}

export default function Index() {
    return null;
}
