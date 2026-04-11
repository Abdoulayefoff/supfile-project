export const FILES = [
  { id:"f1",  name:"contrat-2026.pdf",        type:"file",   mime:"application/pdf",  size:2_500_000,   modified:"Il y a 2h",   owner:"Me",           starred:true,  parentId:null },
  { id:"f2",  name:"photo-vacances.jpg",       type:"file",   mime:"image/jpeg",       size:4_200_000,   modified:"Hier 14:32",  owner:"Me",           starred:false, parentId:null },
  { id:"f3",  name:"presentation-q4.pptx",     type:"file",   mime:"application/pptx", size:8_100_000,   modified:"Oct 12",      owner:"Me",           starred:false, parentId:"d1" },
  { id:"f4",  name:"budget-2024.xlsx",         type:"file",   mime:"application/xlsx", size:156_000,     modified:"Hier",        owner:"David Chen",   starred:false, parentId:"d2" },
  { id:"f5",  name:"readme.md",                type:"file",   mime:"text/markdown",    size:4_200,       modified:"Il y a 3j",   owner:"Me",           starred:false, parentId:null },
  { id:"f6",  name:"demo-video.mp4",           type:"file",   mime:"video/mp4",        size:120_000_000, modified:"Il y a 5j",   owner:"Me",           starred:false, parentId:"d3" },
  { id:"f7",  name:"podcast-ep12.mp3",         type:"file",   mime:"audio/mp3",        size:45_000_000,  modified:"Il y a 1sem", owner:"Me",           starred:false, parentId:"d3" },
  { id:"f8",  name:"logo-supfile.png",         type:"file",   mime:"image/png",        size:320_000,     modified:"Oct 5",       owner:"Sarah Miller", starred:true,  parentId:"d4" },
  { id:"f9",  name:"notes.txt",                type:"file",   mime:"text/plain",       size:1_200,       modified:"Il y a 2j",   owner:"Me",           starred:false, parentId:null },
  { id:"f10", name:"architecture-diagram.pdf", type:"file",   mime:"application/pdf",  size:1_800_000,   modified:"Oct 10",      owner:"Me",           starred:false, parentId:"d1" },
  { id:"d1",  name:"Client Projects",          type:"folder", modified:"Hier",         owner:"Me",           starred:false, parentId:null },
  { id:"d2",  name:"Finance",                  type:"folder", modified:"Oct 12",       owner:"Me",           starred:false, parentId:null },
  { id:"d3",  name:"Médias",                   type:"folder", modified:"Il y a 5j",    owner:"Me",           starred:false, parentId:null },
  { id:"d4",  name:"Brand Assets",             type:"folder", modified:"Oct 5",        owner:"Sarah Miller", starred:false, parentId:"d1", shared:true },
];

export const TRASH = [
  { id:"t1", name:"old-report.pdf",   size:1_200_000,  deleted:"Il y a 2j" },
  { id:"t2", name:"photo-test.jpg",   size:800_000,    deleted:"Il y a 5j" },
  { id:"t3", name:"archive-2022.zip", size:45_000_000, deleted:"Il y a 8j" },
];

export const NAV_ITEMS = [
  { icon:"dashboard",     label:"Dashboard", page:"dashboard" },
  { icon:"folder_shared", label:"Mon Drive", page:"drive" },
  { icon:"group",         label:"Partagés",  page:"shared" },
  { icon:"schedule",      label:"Récents",   page:"drive" },
  { icon:"star",          label:"Favoris",   page:"drive" },
  { icon:"delete",        label:"Corbeille", page:"trash" },
];
