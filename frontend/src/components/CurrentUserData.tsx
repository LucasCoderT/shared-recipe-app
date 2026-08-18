import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

export const CurrentUserData = () => {
    const { data, isPending, isError } = useWhoamiQuery();

    if (isPending) {
        return <p>Loading...</p>;
    }

    if (isError) {
        return <p className="bad">Failed to connect to the backend.</p>;
    }

    return (
        <>
            <p>
                {data.authenticated
                    ? `Signed in as ${data.username ?? "unknown"}`
                    : "Not signed in. Log in at /admin/ to see this change."}
            </p>
        </>
    );
};
