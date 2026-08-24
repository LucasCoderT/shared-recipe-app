import { z } from "zod";

/**
 * Shared field builders.
 *
 * These mirror the DRF serializers field for field. The rule is that the client
 * only re-states rules it can actually evaluate on its own: max lengths, blank
 * checks, numeric ranges. Anything that needs the database or a registry the
 * browser does not have stays server-authoritative and comes back as a 400.
 *
 * Deliberately NOT validated here:
 *   - whether a unit is real (pint's registry lives on the server)
 *   - whether a password is too common (AUTH_PASSWORD_VALIDATORS)
 *   - whether a recipe already has five tags
 *   - whether the user already reviewed this recipe
 */

/** DRF strips surrounding whitespace and rejects blank, via validate_nonblank_text. */
export const nonBlankText = (max: number, label: string) =>
    z
        .string()
        .trim()
        .min(1, { error: `${label} must not be blank.` })
        .max(max, { error: `${label} must be ${max} characters or fewer.` });

/** TextField columns have no length cap in the database. */
export const nonBlankProse = (label: string) =>
    z
        .string()
        .trim()
        .min(1, { error: `${label} must not be blank.` });

/** validate_optional_text strips but permits empty. */
export const optionalText = z.string().trim().default("");

/**
 * DecimalField(max_digits=10, decimal_places=2, min_value=0.01).
 *
 * Kept as a string end to end: DRF renders decimals as strings, form inputs
 * produce strings, and going through a JS number would lose precision on the
 * way. The regex enforces the column shape before the range check runs.
 */
/** Decimal(10, 2): up to 8 digits before the point, up to 2 after. */
export const QUANTITY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

/**
 * The same shape, relaxed for a half-typed value. "1." and "" are not valid
 * quantities but are valid things to be partway through typing, so the input
 * accepts them and QUANTITY_PATTERN rejects them on submit.
 */
export const PARTIAL_QUANTITY_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;

export const quantity = z
    .string()
    .trim()
    .min(1, { error: "Quantity is required." })
    .regex(QUANTITY_PATTERN, {
        error: "Use a number with up to 2 decimal places.",
    })
    .refine((value) => Number(value) >= 0.01, {
        error: "Quantity must be greater than 0.",
    });

export const optionalQuantity = z.union([quantity, z.literal("")]).optional();

/**
 * Optional: a countable ingredient has no unit, only a quantity. "3 eggs" has
 * nothing sensible to put in the slot, and forcing one would mean inventing a
 * placeholder that then shows up in the UI.
 *
 * When present, the value is checked against pint on the server. The client
 * only enforces the column width, so an unknown unit surfaces as a field error
 * from the API rather than being guessed at here.
 */
export const unit = z
    .string()
    .trim()
    .max(50, { error: "Unit must be 50 characters or fewer." })
    .default("");

export const email = z
    .email({ error: "Enter a valid email address." })
    .trim()
    .max(150, { error: "Email must be 150 characters or fewer." })
    .transform((value) => value.toLowerCase());

/**
 * Login only checks presence. Restating the server's password policy here would
 * mean a rule to keep in sync for no benefit, and would reject legitimate older
 * passwords that predate a policy change.
 */
export const currentPassword = z.string().min(1, { error: "Password is required." });

/** Registration mirrors MinimumLengthValidator only; the rest come back as 400s. */
export const newPassword = z
    .string()
    .min(8, { error: "Password must be at least 8 characters." });

/**
 * The optimistic-locking token. Sent on update and delete; when present the
 * server compares it against the row's current updated_at and returns 409 if
 * the row moved on. Omitting it skips the check, so it is optional here too.
 *
 * Sent as camelCase: CamelCaseJSONParser converts it to updated_at before
 * the view reads it.
 */
export const staleWriteToken = z.object({
    updatedAt: z.iso.datetime({ offset: true }).optional(),
});
