import { useQuery } from "@tanstack/react-query";
import { whoamiQuery } from "~/api/queries";

export const useWhoamiQuery = () => useQuery(whoamiQuery);
