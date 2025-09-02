import React, { useEffect } from 'react';
import { get , del , set} from "idb-keyval";
import { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import pdfFile from './../src/files/demo.pdf'
import dropDown from './images/down-arrow.png'
import trash from './images/trash.png'
import FullScreenPdfDrop from './Upload';
const App = () => {
    const pdfUrl = pdfFile
    const thumbnailPluginInstance = thumbnailPlugin();
    const { Cover } = thumbnailPluginInstance;
    const [totalPages, setTotalPages] = useState(0);
    const [startOrEnd,setStartOrEnd] = useState(null)
    
    const [arrayOfPageNumbers,setArrayOfPageNumbers] = useState([])
    const [pdfile,setPdfile] = useState(null)
     const [previewUrl, setPreviewUrl] = useState(null);
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
    useEffect(()=>{
        console.log(arrayOfPageNumbers,arrayOfPageNumbers.length,'aa')
    },[arrayOfPageNumbers])
    useEffect(()=>{
        console.log(pdfile,pdfUrl,'pd')
    },[pdfile,pdfUrl])
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
            !range.topic?alert('Topic missing'):console.log('ok')
            const newRange = {
                ...range,
                start:range.start + 2,
                end:range.end + 2,
            }
            formData.append("ranges", JSON.stringify(newRange));
            });
             for (let pair of formData.entries()) {
                console.log(pair[0] + ":", pair[1]);
            }
            formData.append("doctype",JSON.stringify(qpms))
            for (let [key, value] of formData.entries()) {
            console.log(key, value,'yooooo');
            }



            try {
                const response = await fetch("http://127.0.0.1:8000/split-pdf/", {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                   console.log("Server response:", data);
                   await del("pdfInDb")
                   setPdfile(null)
                   alert("PDF split successfull!");

            }
            catch (error) {
                console.error("Upload failed:", error);
            }
}
const deleteHandler = async() => {
    del("pdfInDb")
    .then(() => del("array"))
    .then(() => {
        setArrayOfPageNumbers([]);
        setPdfile(null);
        setPreviewUrl(null);
        setQpms("qp");
    })
    .catch(err => console.error(err));

    
    
}
        
        return(
        previewUrl && pdfile ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">

            <div className="page-container">
                <button className='cta' onClick={handleUpload}>
                        Web
                </button>
                
                <img onClick={()=>deleteHandler()} className='delete' src={trash} alt="" />
                <div className="qp-ms">
                    <div onClick={()=>setQpms('qp')} className="qp">
                        QP
                    </div>
                    <div onClick={()=>setQpms('ms')} className="ms">
                        MS
                    </div>
                    <div 
                    style={qpms=='qp'?{left:'0.05em'}:{left:'9.1em'}}
                    className="border">

                    </div>

                </div>
                <div 
                    className='cover-container-main'
                    style={{ 
                        borderRadius: '12px',
                        maxWidth: '100%',
                    }}
                >
                    {/* Render all thumbnails immediately */}
                    {totalPages > 0 && (
                        Array.from({ length: totalPages }).map((_, index) => {
                            // console.log(index,'in')
                            return(
                            <CoverComponent 
                              index={index-1} 
                              Cover={Cover}
                              arrayOfPageNumbers={arrayOfPageNumbers}
                              setArrayOfPageNumbers={setArrayOfPageNumbers} 
                              startOrEnd={startOrEnd}
                              setStartOrEnd={setStartOrEnd}
                              active={active}
                              setActive={setActive}
                            />
                            )
                        })
                    )}
                    

                    {/* Hidden viewer to provide context and load the PDF */}
                     <div className='viewer'> 
                        <Viewer fileUrl={previewUrl} plugins={[thumbnailPluginInstance]} onDocumentLoad={(e) => { setTotalPages(e.doc.numPages); }} />
                     </div>   
                </div>
            </div>
        </Worker>):(
        <FullScreenPdfDrop
            pdfile={pdfile}
            setPdfile={setPdfile}
        />
        )
    )
           
       
};


const CoverComponent = ({active,setActive,index,arrayOfPageNumbers,setArrayOfPageNumbers,Cover,startOrEnd,setStartOrEnd}) => {
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
                // setArrayOfPageNumbers(prev => prev.slice(0, -1));

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
        })
    }

const options = [
    'Bonding-Structure',
    'Reactivity',
    'Atomic-Structure',
    'Seperation',
    'Moles',
    'Acids',
    'Gases',
    'Chemical-test',
    'Organic',
    'Rate-of-reaction',
    'E=mcT',
    'arrangement',
    'Critical',
    'Fusion',
]


    const [droppedDown,setDropedDown] = useState(false)
    return(
        <div onClick={()=>{
            if(droppedDown){
                setDropedDown(false)
            }
        }}  
        className='cover-container'>
          
          {/* DropDown */}
          {arrayOfPageNumbers.map((object)=>{
            if(object.end===index)
              {
                return (
                    <div style={droppedDown?{zIndex:5}:{}} className="drop-container">
                        <div onClick={()=> setDropedDown(true)} className="drop-icon-cont">
                          <img  className='drop-down' src={dropDown} alt="" />
                        </div>
                        
                           {droppedDown?(
                            <div className="dropdown-menu">
                            {options.map((option)=>{
                               return( 
                               <div onClick={()=>dropDownHandler(option)} className="section">
                                    <h1>
                                        {option}
                                    </h1>
                                </div>
                               )
                            })}
                           </div>
                           ):''}
                        
                        
                    </div>
                      )
              }
            }) 
          }
          {/* Ends */}



          <div onClick={()=>{clickHandler(index)
           }} className="">
            <Cover
            
                key={index}
                getPageIndex={() => index + 1}
                width={850}
            />

            <div 
            className={`fore-ground ${addedToArray}`}
            >
            </div>
          </div>


        </div>
    )
}

export default App;