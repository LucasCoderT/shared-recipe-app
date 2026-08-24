import { Link as RouterLink } from "react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { components } from "~/schema";

type GridCard = components["schemas"]["RecipeGridCard"];

export const RecipeCard = ({ recipe }: { recipe: GridCard }) => (
    <Card sx={{ height: "100%" }}>
        <CardActionArea
            component={RouterLink}
            to={`/recipes/${recipe.id}`}
            sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
        >
            {recipe.image ? (
                <CardMedia
                    component="img"
                    height="160"
                    image={recipe.image}
                    alt=""
                    sx={{ objectFit: "cover" }}
                />
            ) : (
                // A photo is optional in the spec, so a recipe without one is a
                // normal state rather than a broken image.
                <Box
                    sx={{
                        height: 160,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "action.hover",
                        color: "text.disabled",
                    }}
                >
                    <Typography variant="body2">No photo</Typography>
                </Box>
            )}

            <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                    {recipe.name}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    {recipe.rating === null ? (
                        <Typography variant="body2" color="text.secondary">
                            Not yet rated
                        </Typography>
                    ) : (
                        <>
                            <Rating
                                value={recipe.rating}
                                precision={0.1}
                                size="small"
                                readOnly
                            />
                            <Typography variant="body2" color="text.secondary">
                                {recipe.rating.toFixed(1)}
                            </Typography>
                        </>
                    )}
                </Stack>

                {/* Already limited to three, in position order, by the server. */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {recipe.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                </Box>
            </CardContent>
        </CardActionArea>
    </Card>
);
