import { superdevClient } from "@/lib/superdev/client";

export const Alert = superdevClient.entity("Alert");
export const Domain = superdevClient.entity("Domain");
export const MonitoringResult = superdevClient.entity("MonitoringResult");
export const User = superdevClient.auth;
