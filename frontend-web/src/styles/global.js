const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.13); border-radius: 9999px; }

  .fade { animation: fadeIn .22s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }

  .float { animation: float 5s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  .row-hover  { transition: background .12s; cursor: pointer; }
  .card-hover { transition: all .2s cubic-bezier(.4,0,.2,1); cursor: pointer; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,91,191,.12) !important; }

  input, select { font-family: 'Inter', sans-serif; outline: none; }
  input:focus { box-shadow: 0 0 0 2px #005bbf !important; }

  .sf-input {
    border: none; border-radius: 12px; padding: 11px 14px;
    font-size: 14px; transition: box-shadow .2s;
  }
  .sf-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .10em; display: block; margin-bottom: 6px;
  }
  .progress {
    height: 100%; border-radius: 9999px;
    background: linear-gradient(90deg, #005bbf, #1a73e8); transition: width .5s;
  }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    border-radius: 8px; cursor: pointer; border-left: 3px solid transparent;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    transition: all .15s;
  }
  .nav-item:hover { background: rgba(0,91,191,.06); }
  .nav-item.active { border-left-color: #1a73e8; background: rgba(26,115,232,.10); color: #1a73e8 !important; }

  .upload-zone {
    border: 2px dashed; border-radius: 16px; padding: 36px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    cursor: pointer; transition: all .2s; text-align: center;
  }
  .upload-zone.drag { border-color: #005bbf !important; background: rgba(0,91,191,.05) !important; }

  .ctx-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px;
    border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
    transition: background .12s;
  }
  .ctx-item:hover { background: rgba(0,0,0,.06); }

  .toggle {
    width: 44px; height: 24px; border-radius: 9999px; cursor: pointer;
    position: relative; transition: background .2s;
  }
  .toggle-knob {
    position: absolute; top: 3px; width: 18px; height: 18px; border-radius: 50%;
    background: white; box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: left .2s;
  }
`;

export default GLOBAL_CSS;
