/**
 * External dependencies
 */
import React, { useEffect, useState, Suspense } from "react";

import {
  useHistory
} from "react-router-dom";
import {
  atom,
  useSetRecoilState,
  useRecoilValue,
  selector,
  selectorFamily,
  useRecoilValueLoadable,
  useRecoilStateLoadable,
  useRecoilCallback
} from "recoil";
import axios from "axios";
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

/**
 * Internal dependencies
 */
import Drive, { 
  folderDictionarySelector, 
  globalSelectedNodesAtom, 
  folderDictionary, 
  clearDriveAndItemSelections,
  fetchDrivesSelector,
  encodeParams,
  fetchDriveUsers,
  fetchDrivesQuery,
} from "../../_reactComponents/Drive/Drive";
import { 
  useAddItem,
  useDeleteItem,
  useRenameItem
} from "../../_reactComponents/Drive/DriveActions";
import { BreadcrumbContainer } from "../../_reactComponents/Breadcrumb";
import Button from "../../_reactComponents/PanelHeaderComponents/Button";
import DriveCards from "../../_reactComponents/Drive/DriveCards";
import "../../_reactComponents/Drive/drivecard.css";
import DoenetDriveCardMenu from "../../_reactComponents/Drive/DoenetDriveCardMenu";
import '../../_utils/util.css';
import GlobalFont from "../../_utils/GlobalFont";
import { driveColors, driveImages } from '../../_reactComponents/Drive/util';
import Tool from '../_framework/Tool';
import { useToolControlHelper } from '../_framework/ToolRoot';
import Toast, { useToast } from '../_framework/Toast';
import {drivecardSelectedNodesAtom} from '../library/Library';
import Enrollment from "./Enrollment";

function Container(props){
  return <div
  style={{
      maxWidth: "850px",
      // border: "1px red solid",
      margin: "20px",
  }
  }
  >
      {props.children}
  </div>
}
export default function  Course(props) {
  // console.log(">> course props",props);

  const { openOverlay, activateMenuPanel } = useToolControlHelper();
  const [toast, toastType] = useToast();
  let routePathDriveId = "";
  let routePathFolderId = "";
  let pathItemId = "";
  let itemType = "";
  let urlParamsObj = Object.fromEntries(
    new URLSearchParams(props.route.location.search)
  );
    if (urlParamsObj?.path !== undefined) {
    [
      routePathDriveId,
      routePathFolderId,
      pathItemId,
      itemType,
    ] = urlParamsObj.path.split(":");
  }
  if (urlParamsObj?.path !== undefined) {
    [
      routePathDriveId
    ] = urlParamsObj.path.split(":");
  }
  let courseId = "";
  if (urlParamsObj?.courseId !== undefined) {
    courseId = urlParamsObj?.courseId;
  }

  useEffect(() => {
    activateMenuPanel(1);
  }, [activateMenuPanel]);
  const history = useHistory();

  const driveCardSelection = ({item}) => {
    let newParams = {};
    newParams["path"] = `${item.driveId}:${item.driveId}:${item.driveId}:Drive`;
    newParams["courseId"] = `${item.courseId}`;
    history.push("?" + encodeParams(newParams));
  }
  const setDrivecardSelection = useSetRecoilState(drivecardSelectedNodesAtom)
  const clearSelections = useSetRecoilState(clearDriveAndItemSelections);
  const [openEnrollment, setEnrollmentView] = useState(false);

  function cleardrivecardSelection(){
    setDrivecardSelection([]);
    // let newParams = {};
    // newParams["path"] = `:::`;
    // history.push("?" + encodeParams(newParams));
  }
  function useOutsideDriveSelector() {

    let newParams = {};
    newParams["path"] = `:::`;
    history.push("?" + encodeParams(newParams));
  }
  let breadcrumbContainer = null;
  if (routePathDriveId) {
    breadcrumbContainer = <BreadcrumbContainer />;
  }

  const setEnrollment = (e) =>{
    e.preventDefault()
    setEnrollmentView(!openEnrollment);
  }

  const enrollCourseId = { courseId: courseId };

  return (
    <Tool>
     <headerPanel title="Course" />
     <navPanel isInitOpen>
      <GlobalFont/>
      <div style={{marginBottom:"40px",height:"100vh"}} 
       onClick={useOutsideDriveSelector} 
       >
      <Drive driveId={routePathDriveId}  foldersOnly={true} />
      </div>
      </navPanel>

      <mainPanel 
      responsiveControls={routePathDriveId ? <Button value={openEnrollment ? "Close Enrollment" : "Open Enrollment"} callback={(e)=>setEnrollment(e)}></Button>: ''}
      >
        {openEnrollment ? <Enrollment selectedCourse={enrollCourseId} />  
        :
        
        <>{breadcrumbContainer}
        <div 
        onClick={()=>{
          clearSelections()
        }}
        className={routePathDriveId ? 'mainPanelStyle' : ''}
        >
          <Container>
          <Drive types={['content','course']}  urlClickBehavior="select" 
         doenetMLDoubleClickCallback={(info)=>{
         let isAssignment = info.item.isAssignment === '0' ? "content" : "assignment";
          openOverlay({type:isAssignment,branchId: info.item.branchId,contentId:info.item.contentId,courseId:courseId,
          // driveId:routePathDriveId,itemId:info.item.itemId,folderId:routePathFolderId, 
          title: info.item.label});
          }}
          />
          </Container>
        

        </div>
       
        <div 
        onClick={
          cleardrivecardSelection
        }
        tabIndex={0}
        className={routePathDriveId ? '' : 'mainPanelStyle' }
        >
       <DriveCards
       types={['course']}
       subTypes={['Administrator']}
       routePathDriveId={routePathDriveId}
       driveDoubleClickCallback={({item})=>{driveCardSelection({item})}}
       />
        </div>     
        </>
}
         </mainPanel>
    </Tool>
  );
}
