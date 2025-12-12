import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";

import axios from "../axios";
import {
  selectUserDataLoadingStatus,
  selectUserrootData,
  setUserData,
  setUserDataLoadingStatus,
} from "../slices/userDataSlice";
import loadingStatuses from "../utils/constants/loadingStatuses";

const getUserData = () => {
  return axios.get("/user");
};

function useUserData() {
  const dispatch = useDispatch();
  const loadingStatus = useSelector(selectUserDataLoadingStatus);
  const userData = useSelector(selectUserrootData);

  const query = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      dispatch(setUserDataLoadingStatus(loadingStatuses.loading));
      const response = await getUserData();
      dispatch(setUserData(response.data));
      dispatch(setUserDataLoadingStatus(loadingStatuses.success));
      return response.data;
    },
    refetchOnMount: false,
  });

  return {
    loadingStatus: loadingStatus,
    isLoading: Boolean(loadingStatus === loadingStatuses.idle || loadingStatus === loadingStatuses.loading),
    userData: userData,
    refetch: query.refetch,
    query: query,
  };
}

export default useUserData;
