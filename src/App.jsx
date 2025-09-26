import React, { useEffect , useMemo , useRef} from 'react';
import { get , del , set} from "idb-keyval";
import { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import pdfFile from './../src/files/demo.pdf'
import dropDown from './images/down-arrow.png'
import trash from './images/trash.png'
import re from './images/arrows.png'
import FullScreenPdfDrop from './Upload';
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import {scale, whileTap , motion} from 'framer-motion'
import { div, h1 } from 'framer-motion/client';
// const sub = 'igcse_chem_p2'
// const sub = 'ial_mecha'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Required for PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


const App = () => {
    const [currentPage,setCurrentPage]=useState(1)
     const [previewUrl, setPreviewUrl] = useState(null);
    const [images, setImages] = useState([]);
    
        useEffect(() => {
            if(currentPage==3){
                const convertPdfToImages = async () => {
                    const pdf = await pdfjsLib.getDocument(previewUrl).promise;
                    const numPages = pdf.numPages;
                    const tempImages = [];
        
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2 }); // adjust scale for quality
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
        
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
        
                        await page.render({ canvasContext: context, viewport }).promise;
        
                        // Convert canvas to base64 image
                        const imgData = canvas.toDataURL('image/png');
                        tempImages.push(imgData);
                    }
        
                    setImages(tempImages);
                };
        
                convertPdfToImages();

            }
        }, [currentPage]);
    
    //
    useEffect(()=>{
       console.log(images,'imggg')
    },[images])
       const arrayOfPaperTypes = require('./paperTypes.json');

  

    const pdfUrl = pdfFile
    const thumbnailPluginInstance = thumbnailPlugin();
    
    const [totalPages, setTotalPages] = useState(0);
    const [startOrEnd,setStartOrEnd] = useState(null)
    const [confirmed,setConfirmed] = useState(false)
    const [prevConfirmed,setPrevConfirmed] = useState(null)
    const [arrayOfPageNumbers,setArrayOfPageNumbers] = useState([])
    const [pdfile,setPdfile] = useState(null)
    const [selectedQpms,setSelectedQpms] = useState('qp')
    const [selectedType,setSelectedType] = useState(null)
     const [qpms,setQpms] = useState('qp')
    console.log("Rendering Parent");
    const [active,setActive] = useState({
        start:null,
        end:null,
        index:null,
    })
    const [prev,setPrev]=useState([])
    useEffect(()=>{
      get("array").then((array) => {
        if (array) {
            setArrayOfPageNumbers([...array]);
            setPrev(array)
        }
      });
    },[])
    useEffect(()=>{
         if(confirmed && {...confirmed}!={...prevConfirmed}){
            set('confirmation',confirmed)
            console.log('setting conf')
         }
    },[confirmed])
    useEffect(()=>{
         if(previewUrl){
            get('confirmation').then((confirmation)=>{
                setPrevConfirmed(confirmed)
                setConfirmed(confirmation)
            })
         }
    },[arrayOfPageNumbers,previewUrl])
    useEffect(()=>{
        const lastIndex = arrayOfPageNumbers.length - 1
        const lastObject = arrayOfPageNumbers[lastIndex]
        setActive({
            start:lastObject?lastObject.start:null,
            end:lastObject?lastObject.end:null,
            index:lastObject?lastIndex:null
        })
        if(arrayOfPageNumbers.length>0 && prev.length<arrayOfPageNumbers.length){
            set("array", arrayOfPageNumbers)
            .then(()=>{
                console.log('array saved')
            })
        }
    },[arrayOfPageNumbers])
    // useEffect(()=>{
    //     console.log(arrayOfPageNumbers,arrayOfPageNumbers.length,'aa')
    // },[arrayOfPageNumbers])
    // useEffect(()=>{
    //     if(pdfile || pdfUrl){
    //         console.log(pdfile,pdfUrl,'pd')

    //     }
    // },[pdfile,pdfUrl])


    // useEffect(()=>{
    //     console.log(confirmed,'c')
    // },[confirmed])
    useEffect(()=>{
        if (!pdfile) {
            setPreviewUrl(null);
            get("pdfInDb").then((savedFile) => {
                if (savedFile) setPdfile(savedFile);
            });
            return;
        }
       if(pdfile){
           const buffer = async() => {
                const arrayBuffer = await pdfile.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
            } 
           buffer()
       }
       return () => {
           if (previewUrl) URL.revokeObjectURL(previewUrl);
       }
    },[pdfile])

      
      const handleUpload = async () => {
            if (!pdfile) {
            alert("Please select a PDF file firstt!");
            return;
            }
            
            const formData = new FormData();
            formData.append("file", pdfile);

            // Append each range object as JSON string
            arrayOfPageNumbers.forEach((range, index) => {
                console.log(range,'ds')
            !range.topic?alert('Topic missing',arrayOfPageNumbers):console.log('ok')
            const newRange = {
                ...range,
                start:range.start + 1,
                end:range.end + 1,
            }
            formData.append("ranges", JSON.stringify(newRange));
            });
             for (let pair of formData.entries()) {
                console.log(pair[0] + ":", pair[1]);
            }
            formData.append("doctype",JSON.stringify(confirmed.qpms))
            formData.append("subject",JSON.stringify(confirmed.type))
            for (let [key, value] of formData.entries()) {
            console.log(key, value,'yooooo');
            }



            try {
                fetch("http://192.168.10.198:8000/hi/")
                .then(async()=>{
                    const response = await fetch("http://192.168.10.198:8000/split-pdf/", {
                        method: "POST",
                        body: formData,
                        cache:"no-store"
                    });
                    const data = await response.json();
                    console.log("Server response:", data);
                    await deleteHandler()
                    alert("PDF split successfull!");

                })
                .catch((err)=>{
                    alert(err)
                })
                

            }
            catch (error) {
                console.error("Upload failed:", error);
                alert(error);
            }
}
const refresh = () => {
    fetch("http://192.168.10.198:8000/hi/")
     .then(()=>{
         alert('refreshed')
     })
}

useEffect(()=>{
    console.log(previewUrl,'pre')
    if(previewUrl && confirmed){
        console.log('setting')
        setCurrentPage(3)
    }
    if(previewUrl && !confirmed){
        setCurrentPage(2)
    }
    if(!previewUrl && !confirmed){
        setCurrentPage(1)
    }
},[previewUrl,confirmed])
useEffect(()=>{
    console.log(currentPage,'cc')
},[currentPage])
const deleteHandler = async() => {
    del("pdfInDb")
    .then(() => del("array"))
    .then(() => {
        del('confirmation')
        .then(()=>{
            setArrayOfPageNumbers([]);
            setPdfile(null);
            setPreviewUrl(null);
            setConfirmed(false);
            setImages([])
            setQpms("qp");

        })
    })
    .catch(err => console.error(err));

    
    
}
        
        return(
            currentPage==1?(
                 <FullScreenPdfDrop
                    pdfile={pdfile}
                    setPdfile={setPdfile}
                />
            ):currentPage==2?(
                 <Uploaded arrayOfPaperTypes={arrayOfPaperTypes} selectedQpms={selectedQpms} setSelectedQpms={setSelectedQpms} selectedType={selectedType} setSelectedType={setSelectedType} setConfirmed={setConfirmed} previewUrl={previewUrl}/> 
            ):(
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">

            <div className="page-container">
                {
                    images.length<1?(
                        <div className='loader-cont'>
                            <div class="loader"></div>
                        </div>
                    ):(
                        <>
                        <motion.button whileTap={{scale:0.8}} className='cta' onClick={handleUpload}>
                                Web
                        </motion.button>
                        
                        <motion.img 
                        whileTap={{scale:0.9}} 
                        onClick={()=>deleteHandler()} 
                        className='delete' 
                        src={trash} 
                        alt="" 
                        />
                        <motion.div 
                        className="refresh"
                        whileTap={{scale:0.9}} 
                        onClick={()=>refresh()} 
                        >
                            <img 
                                src={re} 
                                alt="" 
                            />

                        </motion.div>
                        <div 
                            className='cover-container-main'
                            style={{ 
                                borderRadius: '12px',
                                maxWidth: '100%',
                            }}
                        >
                            {
                                images && images.length>0 &&(
                                    images.map((image,index)=>{
                                        return(
                                        <CoverComponent
                                            index={index}
                                            url={image}
                                            arrayOfPageNumbers={arrayOfPageNumbers}
                                            setArrayOfPageNumbers={setArrayOfPageNumbers} 
                                            startOrEnd={startOrEnd}
                                            setStartOrEnd={setStartOrEnd}
                                            active={active}
                                            setActive={setActive}
                                            confirmed={confirmed}
                                        />
                                        )
                                    })
                                )
                            }
                            

                            {/* Hidden viewer to provide context and load the PDF */}
                            <div className='viewer'> 
                                <Viewer fileUrl={previewUrl} plugins={[thumbnailPluginInstance]} onDocumentLoad={(e) => { setTotalPages(e.doc.numPages); }} />
                            </div>   
                        </div>
                        </>
                    )
                }
                
            </div>
        </Worker>
        )      
    )
           
       
};

const CoverComponent = ({confirmed,active,setActive,index,arrayOfPageNumbers,setArrayOfPageNumbers,url,startOrEnd,setStartOrEnd}) => {

    const [addedToArray,setAddedToArray] = useState('') 
    useEffect(()=>{
        let set;
        const exists = arrayOfPageNumbers.some((obj)=> obj.start==index || obj.end==index)
        if(exists){
            arrayOfPageNumbers.map((obj)=>{
                if(obj.start==index || obj.end==index){
                    setAddedToArray("blue")
                    console.log('sets')
                }
                if(obj.start==index && obj.end==index){
                    setAddedToArray("red")
                }
            })
        }
    },[arrayOfPageNumbers])


    const removeObj = (indexOfTarget,startEnd) => {
        console.log(active)
            const curArray = [...arrayOfPageNumbers]
            const newObj = curArray[active.index]
            console.log(indexOfTarget,'ttarger')
            if(startEnd=='double'){
                console.log('re',active.index,curArray)
                setArrayOfPageNumbers((prev)=>{
                     const finalArray = [...prev]
                     finalArray.pop()
                     return finalArray
                })

                setAddedToArray('')
            }
            if(startEnd=='end'){
                delete newObj.end
                curArray[active.index] = newObj
                setArrayOfPageNumbers(curArray)
                setAddedToArray('')
            }
            

    }
    const clickHandler = (index) => {
        console.log('clo',arrayOfPageNumbers.length)
        const currentArray = [...arrayOfPageNumbers]
        const exists = arrayOfPageNumbers.some((obj)=> obj.start==index || obj.end==index)
        const lastIndex = arrayOfPageNumbers.length - 1
        const lastObject = arrayOfPageNumbers[lastIndex]


            //adders to blue
            if(!exists){
                if(lastObject){
                    if(lastObject.start==active.start){
                        console.log('trrrrrrrrrrr')
                        setArrayOfPageNumbers(()=>{
                            currentArray[lastIndex] = {
                                ...currentArray[lastIndex],
                                end:index
                            }
                            console.log(currentArray,'cccc')
                            return currentArray
                        })
                    }
                }
                if(active.end || arrayOfPageNumbers.length==0){
                    console.log('omw')
                    setArrayOfPageNumbers([...arrayOfPageNumbers,{
                            start:index
                    }])
                }
            }
            //add to red
            if(active.start==index && !active.end && addedToArray=='blue'){
                setArrayOfPageNumbers(()=>{
                    currentArray[lastIndex] = {
                        ...currentArray[lastIndex],
                        end:index
                    }
                    return currentArray
                })
            }
            //removers
            if(active.start==index && active.end==index){
                removeObj(index,'double')
            }
            if(active.start==index && active.end!=index && addedToArray=='red'){
                 removeObj(index,'start')
                //  setAddedToArray('')
            }
            if(active.end==index && active.start!==index){
                removeObj(index,'end')
                // setAddedToArray('')
            }

        
    }


    const dropDownHandler = option => {
        // console.log('in')
        setDropedDown(false)
        arrayOfPageNumbers.map((object,targetIndex)=>{
            if(object.end===index){
                setArrayOfPageNumbers(()=>{
                    const newArray = [...arrayOfPageNumbers]
                    const newObject = newArray[targetIndex]
                    newArray[targetIndex] = {
                        ...newObject,
                        topic:option
                    }
                    return newArray
                })
                
            }
            return
        })
    }
    const isEnd = useMemo(()=>{
        if(active.end==index) return true

    },[active.end])
  

    const inpRef = useRef(null)
    const [droppedDown,setDropedDown] = useState(false)
    return(
        <div className='cover-container'>
          
          {/* DropDown */}
          {arrayOfPageNumbers.map((object)=>{
            if(object.end===index)
              {
                return (
                    <div className="positioner">
                        <div style={droppedDown?{zIndex:5}:{}} className="drop-container">
                            <div onClick={()=> setDropedDown(!droppedDown)} className="drop-icon-cont">
                            <img  className='drop-down' src={dropDown} alt="" />
                            </div>
                            
                            {droppedDown && droppedDown?(
                                <div className="dropdown-menu">
                                {
                                confirmed.list.map((option)=>{
                                return( 
                                <div onClick={()=>{
                                    dropDownHandler(option)
                                }} className="section">
                                        <h1>
                                            {option}
                                        </h1>
                                    </div>
                                )
                                })}
                                <div className="inp-cont">
                                    <input  ref={inpRef} type="text" />
                                    <button onClick={()=>dropDownHandler(inpRef.current.value)} >Go</button>
                                </div>

                            </div>
                            ):''}
                            
                            
                        </div>
                    </div>
                      )
              }
            }) 
          }
          {/* Ends */}



          <div onClick={()=>{clickHandler(index)
           }} className="img-cont">
            <img
                className='img'
                src={url}
            />

            <div 
            className={`fore-ground ${addedToArray}`}
            >
            </div>
          </div>


        </div>
    )
}

const Uploaded = ({
    previewUrl,
    setConfirmed,
    selectedType,
    setSelectedType,
    selectedQpms,
    setSelectedQpms,
    arrayOfPaperTypes
}) => {
    const [pageWidth,setPageWidth] = useState(null)
    const handleDocumentLoad = (e) => {
         console.log(e,'ppppppppp')
    }
    // const [selectedType, setSelectedType] = useState(null);
    const handleToggle = (value) => {
        setSelectedType((prev) => (prev === value ? null : value));
    };
    const uploadHandler = () => {
        if(selectedQpms && selectedType){
            arrayOfPaperTypes.map((obj,i)=>{
                if(obj.name===selectedType) {
                    console.log(obj.list,'listt')
                    setConfirmed({
                    qpms:selectedQpms,
                    type:selectedType,
                    list:[...obj.list]
                    })
                    
                }
            })
            
        }
    }
 
// const [selectedQpms, setSelectedQpms] = useState("qp");
    const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setSelectedQpms(newValue);
    }
  };
    return(
         <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <div className="second-page-container">
            <div style={pageWidth?{width:pageWidth}:{}} className='intro'> 
                <Viewer
                defaultScale={0.5}

                    initialPage={0}
                    enableSmoothScroll={false} 
                    fileUrl={previewUrl?previewUrl:''}
                    onDocumentLoad={handleDocumentLoad}
                    renderPage={(props) =>
                            // 👇 Only render page if it’s the first one
                            props.pageIndex === 0 ? props.canvasLayer.children : null
                    } 
                />

            </div>  
            <div className="select-paper-type-cont">
                 {arrayOfPaperTypes?arrayOfPaperTypes.map((paperType)=>{
                      console.log(paperType,'aa')
                      return(
                      <ToggleButton
                        key={paperType.name}
                        value={paperType.name}
                        selected={selectedType === paperType.name}
                        onChange={() => handleToggle(paperType.name)}
                        sx={{
                            px: 3,
                            py: 1.5,
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 600,
                            border: "2px solid",
                            borderColor: "grey.400",
                            bgcolor: "grey.100",
                            color: "text.primary",
                            "&.Mui-selected": {
                            bgcolor: "grey.500",
                            borderColor: "grey.700",
                            color: "white",
                            },
                            "&.Mui-selected:hover": {
                            bgcolor: "grey.600",
                            },
                            "&:hover": {
                            bgcolor: "grey.200",
                            },
                        }}
                        >
                        {paperType.name}
                      </ToggleButton>
                 )
                 }):''}
            </div>
            <div className="qpms">
                    <ToggleButtonGroup
                    value={selectedQpms}
                    exclusive
                    onChange={handleChange}
                    aria-label="toggle options"
                    >
                    <ToggleButton className="wide-btn" value="qp">QP</ToggleButton>
                    <ToggleButton className="wide-btn" value="ms">MS</ToggleButton>
                    </ToggleButtonGroup>
            </div>
            <motion.button whileTap={{scale:0.8}} className='cta upload-cta' onClick={()=>uploadHandler()}>
                Load
            </motion.button>

        </div>
        </Worker>
    )
}

export default App;