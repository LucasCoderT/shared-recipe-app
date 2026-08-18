import { ApiStatus } from "~/components/ApiStatus";
import { CurrentUserData } from "~/components/CurrentUserData";

export const App = () => {
    return (
        <main className="shell">
            <h1>Shared Recipe Application</h1>
            <section className="panel">
                <ApiStatus />
                <CurrentUserData />
            </section>
        </main>
    );
};
