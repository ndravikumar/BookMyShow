const {
  addMovie,
  updateMovie,
  getAllMovies,
  deleteMovie,
  getMovieById,
} = require("../controllers/movieController");
const { validateJWTToken } = require("../middleware/authorizationMiddleware");
const router = require("express").Router();

router.get("/movie/:id", getMovieById);
/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of movies
 */
router.get("/getAllMovies", getAllMovies);
router.post("/addMovie", addMovie);
router.patch("/updateMovie", updateMovie);
router.delete("/deleteMovie/:movieId", deleteMovie);

module.exports = router;
