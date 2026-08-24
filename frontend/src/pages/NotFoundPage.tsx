import { PageShell } from "~/components/PageShell";
import { Placeholder } from "~/components/Placeholder";

export const NotFoundPage = () => (
    <PageShell title="Page not found">
        <Placeholder note="That route does not exist." />
    </PageShell>
);
