export async function getServerSideProps(context) {
    return {
        redirect: {
            destination: '/checkout/shopping-cart',   // where to send them
            permanent: true,    // 307 redirect (not cached as permanent)
        },
    };
}

export default function Index() {
    return null;
}
