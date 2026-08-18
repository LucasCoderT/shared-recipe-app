import { useHealthQuery } from "~/hooks/useHealthQuery";

export const ApiStatus = () => {
    const { data, isPending, isError } = useHealthQuery();

    if (isPending) {
        return <p>Loading...</p>;
    }

    if (isError) {
        return <p className="bad">Failed to connect to the backend.</p>;
    }

    return (
        <>
            <p className="good">Backend is up. Response: {data.status}</p>
        </>
    );
};
