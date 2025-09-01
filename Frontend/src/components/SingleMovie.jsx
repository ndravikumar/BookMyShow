import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMovieById } from "../api/movie";
import { hideLoading, showLoading } from "../redux/loaderSlice";
import { useDispatch } from "react-redux";
import { message, Input, Divider, Row, Col } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { DateTime } from "luxon";
import { getAllTheatresByMovie } from "../api/show";

const SingleMovie = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [movie, setMovie] = useState();
  const [theatres, setTheatres] = useState([]);
  const [date, setDate] = useState(DateTime.now().toFormat("yyyy-MM-dd"));

  const getData = async () => {
    try {
      dispatch(showLoading());
      const response = await getMovieById(params.id);
      if (response.success) {
        setMovie(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(hideLoading());
    } catch (err) {
      message.error(err.message);
      dispatch(hideLoading());
    }
  };

  const getAllTheatres = async () => {
    try {
      dispatch(showLoading());
      const response = await getAllTheatresByMovie({ movie: params.id, date });
      if (response.success) {
        setTheatres(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(hideLoading());
    } catch (err) {
      dispatch(hideLoading());
      message.err(err.message);
    }
  };

  const handleDate = (e) => {
    setDate(DateTime.fromISO(e.target.value).toFormat("yyyy-MM-dd"));
    navigate(`/movie/${params.id}?date=${e.target.value}`);
  };
  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getAllTheatres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  return (
    <div className="inner-container" style={{ paddingTop: "20px" }}>
      {movie && (
        <div className="d-flex single-movie-div">
          <div className="flex-Shrink-0 me-3 single-movie-img">
            <img src={movie.poster} width={150} alt="Movie Poster" />
          </div>
          <div className="w-100">
            <h1 className="mt-0">{movie.title}</h1>
            <p className="movie-data">
              Language: <span>{movie.language}</span>
            </p>
            <p className="movie-data">
              Genre: <span>{movie.genre}</span>
            </p>
            <p className="movie-data">
              Release Date:
              <span>{DateTime.fromISO(movie.date).toFormat("MMM dd yyyy")}</span>
            </p>
            <p className="movie-data">
              Duration: <span>{movie.duration} Minutes</span>
            </p>
            <hr />
            <div className="d-flex flex-column-mob align-items-center mt-3">
              <label className="me-3 flex-shrink-0">Choose the date:</label>
              <Input
                onChange={handleDate}
                type="date"
                min={DateTime.now().toFormat("yyyy-MM-dd")}
                className="max-width-300 mt-8px-mob"
                value={date}
                placeholder="default size"
                prefix={<CalendarOutlined />}
              />
            </div>
          </div>
        </div>
      )}
      {theatres.length === 0 && (
        <div className="pt-3">
          <h2 className="blue-clr">
            Currently, no theatres available for this movie!
          </h2>
        </div>
      )}
      {theatres.length > 0 && (
        <div className="theatre-wrapper mt-3 pt-3">
          <h2>Theatres</h2>
          {theatres.map((theatre) => {
            return (
              <div key={theatre._id}>
                <Row gutter={24} key={theatre._id}>
                  <Col xs={{ span: 24 }} lg={{ span: 8 }}>
                    <h3>{theatre.name}</h3>
                    <p>{theatre.address}</p>
                  </Col>
                  <Col xs={{ span: 24 }} lg={{ span: 16 }}>
                    <ul className="show-ul">
                      {theatre.shows
                        .sort(
                          (a, b) =>
                            DateTime.fromFormat(a.time, "HH:mm") - DateTime.fromFormat(b.time, "HH:mm")
                        )
                        .map((singleShow) => {
                          return (
                            <li
                              key={singleShow._id}
                              onClick={() =>
                                navigate(`/book-show/${singleShow._id}`)
                              }
                            >
                              {DateTime.fromFormat(singleShow.time, "HH:mm").toFormat("hh:mm a")}
                            </li>
                          );
                        })}
                    </ul>
                  </Col>
                </Row>
                <Divider />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SingleMovie;
