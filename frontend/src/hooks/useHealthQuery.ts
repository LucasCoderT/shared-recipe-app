import { useQuery } from "@tanstack/react-query";
import { healthQuery } from "~/api/queries";

export const useHealthQuery = () => useQuery(healthQuery);
