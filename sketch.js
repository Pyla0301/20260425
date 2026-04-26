let grasses = []; // 儲存所有水草資料的陣列
let fishes = [];  // 儲存所有小魚資料的陣列
let bubbles = []; // 儲存大泡泡資料的陣列

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 產生 30 根水草的初始隨機設定
  for (let i = 0; i < 30; i++) {
    grasses.push({
      xRatio: random(0, 1),           // 分佈在視窗寬度的相對位置 (0 ~ 1)
      thickness: random(10, 30),      // 粗細介於 10 到 30 之間
      heightRatio: random(0.1, 0.33), // 高度不超過視窗高度的 1/3 (0.1 ~ 0.33)
      speed: random(0.002, 0.01),     // 降低雜訊變化的速度，減少抽搐感
      noiseOffset: random(0, 10000),  // 用於產生不同方向/相位的雜訊偏移量
      color: random(["#5bba6f", "#3fa34d", "#2a9134", "#137547", "#054a29"]) // 隨機分配水草顏色
    });
  }

  // 產生 8 隻小魚的初始設定
  for (let i = 0; i < 8; i++) {
    let isRight = random() > 0.5; // 一半機率向右，一半機率向左
    fishes.push({
      x: random(0, windowWidth),
      y: random(50, windowHeight - 150),
      size: random(15, 30),           // 魚的大小基準
      speed: isRight ? random(1, 3) : random(-3, -1), // 根據方向決定游動速度
      color: random(["#9b5de5", "#f15bb5", "#fee440", "#00bbf9", "#00f5d4"]) // 隨機挑選你指定的鮮豔顏色
    });
  }

  // 產生 4 個帶有文字的大泡泡
  let bubbleTexts = ["第一週", "第二週", "第三週", "第四週"];
  for (let i = 0; i < 4; i++) {
    bubbles.push({
      text: bubbleTexts[i],
      x: windowWidth * (0.2 * (i + 1)), // 將 4 個泡泡平均分佈在畫面的寬度位置
      baseY: random(150, windowHeight / 2 - 50), // 泡泡的基準高度
      size: 130, // 泡泡的直徑大小
      floatOffset: random(0, TWO_PI), // 給予隨機的相位偏移，讓它們不要同步上下浮動
      currentSize: 130, // 當下的大小（用於滑鼠懸停與重生的平滑動畫）
      state: 'normal',  // 狀態 ('normal' 正常, 'popping' 破裂中)
      popTimer: 0       // 破裂動畫計時器
    });
  }
}

function draw() {
  background('#a9def9');

  // 繪製所有的魚（放在水草之前畫，這樣魚就會在水草後方游動，增加立體感）
  noStroke();
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];
    
    f.x += f.speed; // 讓魚根據速度更新水平位置
    
    // 如果魚游出畫面邊界，讓牠從另一邊重新出現，並換個高度與顏色
    if (f.speed > 0 && f.x > windowWidth + 50) {
      f.x = -50;
      f.y = random(50, windowHeight - 150);
      f.color = random(["#9b5de5", "#f15bb5", "#fee440", "#00bbf9", "#00f5d4"]);
    } else if (f.speed < 0 && f.x < -50) {
      f.x = windowWidth + 50;
      f.y = random(50, windowHeight - 150);
      f.color = random(["#9b5de5", "#f15bb5", "#fee440", "#00bbf9", "#00f5d4"]);
    }

    fill(f.color);
    ellipse(f.x, f.y, f.size * 2, f.size); // 畫橢圓形當作魚身
    
    // 根據魚的游動方向，將尾巴畫在反方向
    let tailOffset = f.size;
    if (f.speed > 0) { // 向右游，尾巴在左邊
      triangle(f.x - tailOffset, f.y, f.x - tailOffset - f.size, f.y - f.size / 2, f.x - tailOffset - f.size, f.y + f.size / 2);
    } else {           // 向左游，尾巴在右邊
      triangle(f.x + tailOffset, f.y, f.x + tailOffset + f.size, f.y - f.size / 2, f.x + tailOffset + f.size, f.y + f.size / 2);
    }
  }

  noFill();

  // 繪製陣列中的所有水草
  for (let i = 0; i < grasses.length; i++) {
    let g = grasses[i];
    stroke(g.color);           // 套用這根水草的專屬顏色
    strokeWeight(g.thickness); // 套用這根水草的專屬粗細

    beginShape();
    let startY = windowHeight;
    let endY = windowHeight * (1 - g.heightRatio); // 計算水草最高點（不超過畫面 1/3）
    let baseX = windowWidth * g.xRatio;            // 計算這根水草的基底 X 座標

    for (let y = startY; y >= endY; y -= 15) {
      // 1. 全域海流：利用 sin() 產生整體規律的左右推力，並用 baseX 讓波浪有傳遞的時間差
      let currentSway = sin(frameCount * 0.015 + baseX * 0.002) * 120;

      // 2. 局部水流擾動：利用 noise 保留水草本身的細微隨機扭動
      let noiseVal = noise(y * 0.005 + g.noiseOffset, frameCount * g.speed); // 降低 y 的乘數，讓空間變化更平滑
      let localSway = map(noiseVal, 0, 1, -20, 20); // 縮小局部擾動的幅度
      
      // 總偏移量 = 規律海流推力 + 隨機局部擾動
      let xOffset = currentSway + localSway;
      
      // 越往上搖晃越明顯（利用 pow 讓底部較硬挺，越往上越柔軟彎曲）
      let swayAmount = map(y, startY, endY, 0, 1);
      let x = baseX + xOffset * pow(swayAmount, 1.5);
      
      if (y === startY) curveVertex(x, y); // 增加底部控制點，確保曲線畫到底部
      curveVertex(x, y);
      if (y - 15 < endY) curveVertex(x, y); // 增加頂部控制點，確保曲線畫到頂端
    }
    endShape();
  }

  // 繪製三個大泡泡及文字 (畫在最後，確保泡泡在畫面的最上層)
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 利用 sin() 函數讓泡泡在基準高度上平滑地上下漂浮
    let floatY = sin(frameCount * 0.02 + b.floatOffset) * 20;
    let currentY = b.baseY + floatY;

    if (b.state === 'normal') {
      // 計算滑鼠與泡泡的距離
      let d = dist(mouseX, mouseY, b.x, currentY);
      let targetSize = b.size;
      
      // 如果滑鼠碰到泡泡，設定目標大小為 1.15 倍
      if (d < b.currentSize / 2) {
        targetSize = b.size * 1.15;
      }
      
      // 使用 lerp 平滑過渡當前大小與目標大小
      b.currentSize = lerp(b.currentSize, targetSize, 0.15);

      // 1. 畫泡泡外觀 (半透明白色外框與稍微透明的內部)
      stroke(255, 180);
      strokeWeight(3);
      fill(255, 80);
      ellipse(b.x, currentY, b.currentSize, b.currentSize);

      // 2. 畫泡泡的亮點 (在左上方畫一個小圓點增加泡泡的立體感與光澤)
      noStroke();
      fill(255, 220);
      ellipse(b.x - b.currentSize * 0.25, currentY - b.currentSize * 0.25, b.currentSize * 0.15, b.currentSize * 0.15);

      // 3. 寫上文字 (字體大小也隨著泡泡縮放)
      fill('#023e8a'); // 設定深藍色文字，增加在淺色背景上的辨識度
      textAlign(CENTER, CENTER);
      let currentTextSize = (b.currentSize / b.size) * 28;
      textSize(currentTextSize);
      text(b.text, b.x, currentY);
    } else if (b.state === 'popping') {
      b.popTimer++;
      let expandSize = b.size + b.popTimer * 6; // 破裂波紋往外擴張
      let alpha = map(b.popTimer, 0, 15, 255, 0); // 透明度逐漸消失
      
      if (b.popTimer > 15) {
        // 如果是「第一週」的泡泡，在破裂動畫結束後跳轉網頁
        if (b.text === "第一週") {
          window.location.href = "https://pyla0301.github.io/20260223/";
        } else if (b.text === "第二週") {
          window.location.href = "https://pyla0301.github.io/20260302-1/";
        } else if (b.text === "第三週") {
          window.location.href = "https://pyla0301.github.io/20260316/";
        } else if (b.text === "第四週") {
          window.location.href = "https://pyla0301.github.io/20260323/";
        }
        
        b.state = 'normal'; // 動畫結束，變回正常狀態
        b.currentSize = 0;  // 從 0 開始變大，產生「重生」的視覺效果
      } else {
        // 畫出擴散的破裂波紋
        noFill();
        stroke(255, alpha);
        strokeWeight(4);
        ellipse(b.x, currentY, expandSize, expandSize);
        
        // 畫出幾個飛濺的小水滴
        fill(255, alpha);
        noStroke();
        for (let j = 0; j < 6; j++) {
          let angle = j * (TWO_PI / 6);
          let dropX = b.x + cos(angle) * (expandSize / 2);
          let dropY = currentY + sin(angle) * (expandSize / 2);
          ellipse(dropX, dropY, 8, 8);
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 監聽滑鼠點擊事件
function mousePressed() {
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    if (b.state === 'normal') {
      let floatY = sin(frameCount * 0.02 + b.floatOffset) * 20;
      let currentY = b.baseY + floatY;
      
      // 檢查滑鼠是否點擊在泡泡範圍內
      let d = dist(mouseX, mouseY, b.x, currentY);
      if (d < b.currentSize / 2) {
        b.state = 'popping'; // 切換為破裂狀態
        b.popTimer = 0;      // 重置動畫計時器
        break; // 每次點擊只戳破一個泡泡
      }
    }
  }
}
