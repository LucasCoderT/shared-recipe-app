import { QueryClient } from "@tanstack/react-query";

/**
 * Created at module scope rather than inside a component so router middleware
 * can reach the same cache the components use. Without that the auth guard
 * would fire its own /whoami request on every navigation.
 *
 * Query definitions live in ~/api/queries.
 */
export const queryClient = new QueryClient();
