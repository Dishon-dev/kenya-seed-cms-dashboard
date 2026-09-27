import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadProductImages, saveImageToDatabase, deleteImage } from '../utils/imageStorage';
import { getVarieties, createOrUpdateVariety, deleteVariety, getCategory } from '../utils/databaseApi';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

export interface ProductVariety {
  id: string;
  name: string;
  altitude: string;
  maturity: string;
  yield: string;
  attributes: string[];
  featured?: boolean;
  status: 'active' | 'inactive';
  lastUpdated: string;
  imageData?: string;
  imageFile?: File;
}

// Sample data for different product varieties
const productVarietiesData: Record<string, Record<string, ProductVariety[]>> = {
  maize: {
    'highland-varieties': [
      {
        id: 'h614d',
        name: 'H614D',
        altitude: '1500-2800m',
        maturity: '160-210 days',
        yield: '38 bags/acre',
        attributes: [
          'Sweet tasting variety',
          'Has good density',
          'Has long storage period',
          'Resistant to GLS and Blight'
        ],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-11'
      },
      {
        id: 'h628',
        name: 'H628',
        altitude: '1500-2800m',
        maturity: '150-210 days',
        yield: '46 bags/acre',
        attributes: [
          'Has heavy white grains',
          'High yield',
          'Resistant to blight and GLS',
          'Flint type'
        ],
        status: 'active',
        lastUpdated: '2024-01-11'
      }
    ]
  },
  horticulture: {
    'cabbages': [
      {
        id: 'gloria-star-f1',
        name: 'Gloria Star F1',
        altitude: 'N/A',
        maturity: '75-85 days',
        yield: 'N/A',
        attributes: ['Shape-Round', 'Head weight – 4-5Kg', 'Very firm and Compact', 'Excellent Field Holding ability and long Shelf Life', 'High tolerance to black rot', 'Improved uniformity'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Q0FGNTAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
      },
      {
        id: 'pruktor-f1',
        name: 'Pruktor F1',
        altitude: 'N/A',
        maturity: '85-90 days',
        yield: 'N/A',
        attributes: ['Shape- High Round', 'Head weight – 4-5Kg', 'Firmness – Very firm and Compact', 'Good field Holding ability and long Shelf Life', 'Tolerant to Black Rot and Ring Spot'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'imani-f1',
        name: 'Imani F1',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: '14k heads/acre',
        attributes: ['Round, Firm and compact head', 'Head weight 5-8kgs', 'Widely adaptable and Tolerant to black rot', 'Good field holding capacity and Excellent taste and flavour'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'queen-f1',
        name: 'Queen F1',
        altitude: 'N/A',
        maturity: '85-90 days',
        yield: 'N/A',
        attributes: ['Shape- Round', 'Head weight– 4-5Kg', 'Attractive green and Firm Head', 'Tolerant to Black Rot'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'chairman-f1',
        name: 'Chairman F1',
        altitude: 'N/A',
        maturity: '90-100 days',
        yield: 'N/A',
        attributes: ['Shape - Round', 'Head weight – 5-6Kg', 'Firm head', 'Deep Green colour', 'Tolerant to Black rot and Ring spot'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'pak-choi-green',
        name: 'Pak Choi Green',
        altitude: 'N/A',
        maturity: '50-60 days',
        yield: 'N/A',
        attributes: ['Very nutritious with Vitamin A,B,C, calcium, magnesium and iron', 'The entire vegetable is edible eaten raw or cooked', 'Tight cylindrical heads', 'Light green slender leaves', 'Boost immune health'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'chinese-cabbage-michihili',
        name: 'Chinese Cabbage (Michihili)',
        altitude: 'N/A',
        maturity: '50-60 days',
        yield: 'N/A',
        attributes: ['Tight cylindrical heads', 'Light green slender leaves', 'Boost immune health'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'tomatoes': [
      {
        id: 'nyota-f1',
        name: 'Nyota F1',
        altitude: 'N/A',
        maturity: '70-75 days',
        yield: 'N/A',
        attributes: ['Determinate variety', 'Attractive firm oval shaped fruits', 'Vigorous and widely adaptable', 'Resistant to Bacterial Wilt & TYLCV'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNDQzMzYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
      },
      {
        id: 'crown-f1',
        name: 'Crown F1',
        altitude: 'N/A',
        maturity: '65-85 days',
        yield: 'N/A',
        attributes: ['Semi-determinate tomato', 'Attractive firm oval shaped fruits', 'Widely adaptable', 'Fruit Weight 150-180g', 'Early to medium maturity 75-85 days', 'Tolerant to bacterial wilt and tomato yellow leaf curl virus(TYLCV)', 'Tolerance /resistance to verticulum or fusarium wilt'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'kibo-star-f1',
        name: 'Kibo Star F1',
        altitude: 'N/A',
        maturity: '80-85 days',
        yield: 'over 35 tons/acre',
        attributes: ['Prolific semi-determinate', 'Attractive deep coloured blocky shaped fruits', 'Excellent shelf life and transport quality', 'Average fruit weight: 150gm', 'Tolerant to BW and TYLCV', 'Seed rate: 50g/acre'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'super-rio',
        name: 'Super Rio',
        altitude: 'N/A',
        maturity: '75-85 days',
        yield: 'N/A',
        attributes: ['Improved variety', 'Oval shaped firm fruits', 'Medium maturity 80-85 days', 'Widely adaptable determinate variety', 'Good shelf life', 'Tolerant to Bacterial wilt and TYLCV'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'maya-f1',
        name: 'Maya F1',
        altitude: 'N/A',
        maturity: '70 days',
        yield: 'N/A',
        attributes: ['Indeterminate variety', 'Ideal for green House and open field', 'Attractive, firm, oval shaped fruits', 'Has long harvesting period', 'Highly tolerant to TYLCV and BW', 'Fruit weight 110-150g', 'Seed rate 50g/acre'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'brassicas': [
      {
        id: 'cauliflower-snowball',
        name: 'Cauliflower Snowball',
        altitude: 'N/A',
        maturity: '55-60 days',
        yield: 'N/A',
        attributes: ['Attractive, compact white curd', 'Curd Size 0.3 - 0.4Kgs', 'Uniform maturity'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'broccoli-calabrese',
        name: 'Broccoli Calabrese',
        altitude: 'N/A',
        maturity: '50-55 days',
        yield: 'N/A',
        attributes: ['Attractive compact green curd', 'Average head size 0.3-0.4Kgs'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'cauliflower-smilla-f1',
        name: 'Cauliflower Smilla F1',
        altitude: 'N/A',
        maturity: '75 days',
        yield: 'N/A',
        attributes: ['Best for fresh and export market', 'Self covering ability', 'Dome White compact head', 'Average curd weight 1.7 kg', 'Tolerant to black rot'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'collards-simlaw-select',
        name: 'Collards Simlaw Select',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Excellent cooking quality', 'Ideal for distant markets', 'Widely adaptable', 'Most popular vegetable in the region'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'curly-kale',
        name: 'Curly Kale',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Early maturity', 'Large sized curly', 'Dark green leaves', 'High yielding', 'Non-acidic', 'Tender leaves'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ethiopian-kale-kanzera',
        name: 'Ethiopian Kale (Kanzera)',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Leaf green & prolific', 'A valuable source of vitamin and minerals', 'Sweet taste & non-acidic', 'Highly palatable', 'Harvested-leave / uprooted'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'root-crops': [
      {
        id: 'carrot-nantes',
        name: 'Carrot Nantes',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Vigorous in growth', 'Smooth skin', 'Early maturing', 'Sweet and small core roots', 'Cylindrical shape'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM3OTU1NDgiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
      },
      {
        id: 'beetroot-detroit',
        name: 'Beetroot Detroit Dark Red',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Dark green turning red foliage of about 35-45cm', 'Globe shaped smooth skinned tubers', 'Interior colour is deep red', 'Widely adaptable and heat tolerant'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'crimson-globe',
        name: 'Crimson Globe',
        altitude: 'N/A',
        maturity: '60-70 days',
        yield: 'N/A',
        attributes: ['Round flat shape', 'Smooth skin', 'Deep red in colour', 'Medium size'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'turnip-early-purple',
        name: 'Turnip Early Purple Top White Globe',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['An easy and quick growing table variety', 'The tender leaves can be used as vegetables', 'Uniform with unique flavour'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'radish-cherry-belle',
        name: 'Radish Cherry belle',
        altitude: 'N/A',
        maturity: '40 days',
        yield: 'N/A',
        attributes: ['High yielding variety', 'Grows vigorously and matures in 40days after sowing', 'The flesh is slightly flavored'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'onions-leeks': [
      {
        id: 'improved-red-creole',
        name: 'Improved Red Creole',
        altitude: 'N/A',
        maturity: '90 days',
        yield: 'N/A',
        attributes: ['Deep Red colour', 'Uniform and medium sized bulbs', 'Best in low to medium altitude areas', 'Tolerant to Pink rot and Purple blotch disease', 'Excellent curing qualities and storage'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'spring-bunching-onion',
        name: 'Spring Bunching Onion',
        altitude: 'N/A',
        maturity: '80-90 days',
        yield: 'N/A',
        attributes: ['20 - 30cm long', 'Highly adaptable', 'Uniformly sized perennial onion'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'bombay-red',
        name: 'Bombay Red',
        altitude: 'N/A',
        maturity: '110-120 days',
        yield: 'N/A',
        attributes: ['Dark Red in colour', 'Widely adaptable', 'Highly pungent with good curing quality', 'Long storage'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'red-summit-f1',
        name: 'Red Summit F1',
        altitude: 'N/A',
        maturity: '90 days',
        yield: 'N/A',
        attributes: ['Deep Red in colour', 'Uniform bulbs', 'Tolerant to purple blotch', 'Widely adaptable', 'Highly productive', 'Good curing ability and long shelf life'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'leeks-carentan',
        name: 'Leeks Carentan',
        altitude: 'N/A',
        maturity: '75-90 days',
        yield: 'N/A',
        attributes: ['Large, erect white stem with blue green leaves', 'Widely adaptable', 'High disease tolerance'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'watermelon-melons': [
      {
        id: 'julie-f1',
        name: 'Julie F1',
        altitude: 'N/A',
        maturity: '70-75 days',
        yield: 'N/A',
        attributes: ['Vigorous hybrid with oval shaped fruits', 'Medium sized fruits of 12-14kgs', 'Widely adaptable', 'Very sweet and crunchy', 'Disease Tolerant', 'Transport well'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'sweetrose-f1',
        name: 'Sweetrose F1',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Large sized fruits of 10-12kgs', 'Vigorous growth and early maturing variety', 'Good internal quality', 'Resists sunburns'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'sweet-melon-galia-f1',
        name: 'Sweet Melon Galia F1',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Vigorous hybrid with round shaped fruits', 'Medium sized fruits of 4-6kgs', 'Attractive dark green colour with excellent crunchy flavor', 'Prolific fruiter', 'Sugar baby type'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'princess-f1',
        name: 'Princess F1',
        altitude: 'N/A',
        maturity: '80-90 days',
        yield: 'N/A',
        attributes: ['Oval Shaped Fruits', 'Medium size of 8-10Kg', 'Dark Green Stripes', 'Deep red, sweet and crunchy texture'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'cucurbits': [
      {
        id: 'jupiter-f1',
        name: 'Jupiter F1',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['A high prolific producer', 'An outstanding fruit appearance with good flavor', 'Uniform medium sized fruits', 'Good for both fresh and export markets', 'Large Fruit weight', 'Long Shelf life', 'Small pulp cavity', 'Excellent flavor with high brix content (natural sugar)'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'squash-ambassador',
        name: 'Squash Ambassador',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Dark green', 'Prolific fruit production', 'Early maturing', 'Long cylindrical shape'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'pumpkin-elgon-cream',
        name: 'Pumpkin Elgon Cream',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Cream fruit with yellow flesh', 'Highly vegetative with soft edible leaves', 'Sweet, firm and smooth flesh', 'Prolific fruit production', 'Widely adaptable'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'malenge-gabbar-f1',
        name: 'Malenge Gabbar F1',
        altitude: 'N/A',
        maturity: '85-90 days',
        yield: 'N/A',
        attributes: ['Shape Flattish round with mild ribs', 'Green with white strips turns yellowish orange on maturity', '4-5kg average weight', 'Attractive Early medium size hybrid with export quality', 'Yellow fresh when cut'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'cucumber-ashley',
        name: 'Cucumber Ashley',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Medium sized cylindrical shape', 'Light green colour', 'Early maturing', 'Widely adaptable'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'capsicums': [
      {
        id: 'victory-f1-red',
        name: 'Victory F1 (Red)',
        altitude: 'N/A',
        maturity: '80-90 days',
        yield: '10-12 tons/acre',
        attributes: ['Suitable for outdoor and greenhouse production', 'Thick fruits with long shelf life', 'Ideal for fresh markets and export', 'Turns Green to Red colour', 'Fruit weighs 350g', 'Prolific large blocky green to red fruits'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'victory-f1-yellow',
        name: 'Victory F1 (Yellow)',
        altitude: 'N/A',
        maturity: '80-90 days',
        yield: '10-12 tons/acre',
        attributes: ['Ideal for open field and green house', 'Uniform, large and thick fruits', 'Dark green to yellow blocky fruits', 'Fruit weighs 300g', 'Prolific large blocky green to red fruits'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'long-red-cayenne',
        name: 'Long Red Cayenne',
        altitude: 'N/A',
        maturity: '75-80 days',
        yield: '4-5 tons/acre',
        attributes: ['Highly Marketable', 'Has a strong pungent smell', 'Average size of 10cm', 'Popular, long and very pungent red colour pepper'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'super-wonder',
        name: 'Super Wonder',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Ideal for Open field production', 'Very uniform fruits', 'Blocky and medium sized', 'Widely adaptable variety', 'Improved variety', 'Popular blocky green fruits'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'herbs-others': [
      {
        id: 'chives-prago',
        name: 'Chives-Prago',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Edible part: leaves, bulbs', 'Harvest period: graduated the first cut at 80/90 days', 'Improves heart health', 'Fights cancer', 'Detoxify the body', 'Boost skin health'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'basil-genovese',
        name: 'Basil-Genovese',
        altitude: 'N/A',
        maturity: '40 days',
        yield: 'N/A',
        attributes: ['Edible part: leaves', 'Harvesting period: scale with beginning 40 days after sowing', 'Promotes oral health', 'Eases inflammation', 'Skin nourishment', 'Alkalines the body', 'Fight common cold'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'thyme-winter',
        name: 'Thyme-Winter',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Edible part: leaves and tender stems', 'Help prevent fungal and bacterial infection', 'Relieving coughs and have anti-oxidant effect'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'celery-tall-utah',
        name: 'Celery Tall Utah',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Dark green, long, thick and smooth leaves', 'Early maturing and uniform', 'Good tolerance to common diseases', 'Excellent flavour'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'coriander-dahnia-kachumbari',
        name: 'Coriander Dahnia Kachumbari',
        altitude: 'N/A',
        maturity: '30 days',
        yield: 'N/A',
        attributes: ['Attractive green foliage', 'Highly pungent with finely cut foliage', 'Ready for picking within 30 days', 'Unique coriander flavor', 'Ideal for both local and export markets'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'okra-pusa-sawani',
        name: 'Okra Pusa Sawani',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['5 sided and attractive pods', 'Dark green and early maturing variety', 'Very nutritious', 'Ideal for fresh markets and export', 'Reduce risk of serious health conditions', 'Vitamin A and C'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'eggplant-long-purple',
        name: 'Eggplant Long Purple',
        altitude: 'N/A',
        maturity: 'N/A',
        yield: 'N/A',
        attributes: ['Long deep purple fruit', 'Medium maturity with long picking period', 'Highly popular for local and Export market'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  legumes: {
    'beans': [
      {
        id: 'glp-2-rosecoco-nyayo',
        name: 'GLP 2 (Rosecoco/ Nyayo)',
        altitude: 'N/A',
        maturity: '75-90 days',
        yield: '10 bags/acre',
        attributes: ['Dwarf bean with flat pods', 'Prefers medium altitude zones', 'Tolerant to common bean diseases', 'Vigorous variety with high yields', 'Most popular in the market'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'glp-92-mwitemania-sura-mbaya',
        name: 'GLP 92 (Mwitemania/ Sura Mbaya)',
        altitude: 'N/A',
        maturity: '90-95 days',
        yield: '8 bags/acre',
        attributes: ['Spreading growth habit with oval shaped grains', 'Prefers medium altitude zones', 'Good tolerance to heat and common diseases', 'Vigorous variety with high yields'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'glp-1127-mwezi-moja',
        name: 'GLP 1127 (Mwezi Moja)',
        altitude: 'N/A',
        maturity: '85-90 days',
        yield: '8 bags/acre',
        attributes: ['Kidney shaped bean with very high potential', 'Performs well in medium and dryland areas', 'Flowers within a month', 'Does not cause flatulence'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'wairimu-dwarf',
        name: 'Wairimu Dwarf',
        altitude: 'N/A',
        maturity: '70 days',
        yield: '6 bags/acre',
        attributes: ['Performs well in medium and highland areas', 'Dark red kidney shaped bean with very high potential', 'Vigorous growing dwarf variety'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'greengrams': [
      {
        id: 'ks20-makueni',
        name: 'KS20 (Makueni)',
        altitude: 'N/A',
        maturity: '45-60 days',
        yield: '6 bags/acre',
        attributes: ['Dull green colour with rough skin', 'Excellent cooking qualities', 'Drought tolerant', 'Early maturity of 55 days'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'peas': [
      {
        id: 'greenfeast-kagoci',
        name: 'Greenfeast (Kagoci)',
        altitude: 'N/A',
        maturity: '55-60 days',
        yield: '10 bags/acre',
        attributes: ['Dual purpose climbing pea (fresh and dry)', 'Preferred for medium and high altitude', 'Good tolerance to mildew', 'Maturity of 55-60 days', 'Can yield upto 10 bags of 90kg'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'kelvedon-kigondoro',
        name: 'Kelvedon (Kigondoro)',
        altitude: 'N/A',
        maturity: '55-60 days',
        yield: '10 bags/acre',
        attributes: ['Dual purpose dwarf pea (fresh and dry)', 'Prefers medium to high altitudes', 'Good tolerance to mildew', 'First harvest in 65-70 days', 'High yielding potential of upto 1.8 tons an acre'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'plum-gikuyu-kikuyu',
        name: 'Plum (Gikuyu/ Kikuyu)',
        altitude: 'N/A',
        maturity: '55-60 days',
        yield: '10 bags/acre',
        attributes: ['Fresh purpose pea', 'Suitable for highland altitude', 'It\'s a climber pea', 'Maturity of 55-60 days', 'High yielding potential of upto 1.8 tons an acre'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ],
    'cowpeas': [
      {
        id: 'kk1',
        name: 'KK1',
        altitude: 'N/A',
        maturity: '75-90 days',
        yield: '7 bags/acre',
        attributes: ['Dual purpose variety (grain and leaf)', 'Drought tolerant', 'Widely adapted', 'Matures in 65-85 days'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  millet: {
    'finger-millet-seed-varieties': [
      {
        id: 'finger-millet-p-224',
        name: 'Finger Millet P 224',
        altitude: 'N/A',
        maturity: '3-4 months',
        yield: '10-15 bags/acre',
        attributes: ['Brown grain type', 'Tall type with uniform plant height', 'Tolerant to lodging and blast', 'Excellent milling quality'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'finger-millet-katumani',
        name: 'Finger Millet Katumani',
        altitude: 'N/A',
        maturity: '3 months',
        yield: '7-10 bags/acre',
        attributes: ['Reddish grain type', 'Dwarf variety', 'Drought tolerant', 'Widely adaptable'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  pasture: {
    'pasture-seed-varieties': [
      {
        id: 'boma-rhodes',
        name: 'Boma Rhodes',
        altitude: 'N/A',
        maturity: '90-105 days',
        yield: '150-250 bales/acre',
        attributes: ['Soft and excellent herbage', 'Slow growing and hence suited for lower stocking rates', 'Gives bottom tillers and forms thick grass', 'Very popular in the medium altitude areas', 'Drought tolerant'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'elmba-rhodes',
        name: 'Elmba Rhodes',
        altitude: 'N/A',
        maturity: '90-105 days',
        yield: '150-250 bales/acre',
        attributes: ['Soft and excellent herbage', 'High seeding vigor and forage yield', 'Suited for a wide range of climatic conditions but does best in light sandy soils', 'Quick growing and hence suited to intensive grazing'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'nandi-setaria',
        name: 'Nandi Setaria',
        altitude: 'N/A',
        maturity: '70-80 days',
        yield: '150-250 bales/acre',
        attributes: ['Suitable for the high altitude and high rainfall areas', 'Very persistent', 'Good forage quality', 'Tolerant to mild water logging'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'nasiwa-setaria',
        name: 'Nasiwa Setaria',
        altitude: 'N/A',
        maturity: '75-90 days',
        yield: '150-250 bales/acre',
        attributes: ['Good persistence under grazing', 'Drought tolerant', 'Good forage quality', 'Tolerant to mild water logging'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'coloured-guinea',
        name: 'Coloured Guinea',
        altitude: 'N/A',
        maturity: '50-60 days',
        yield: '150-250 bales/acre',
        attributes: ['Good herbage quality', 'Thrives well in a wide range of rainfall regimes', 'Can withstand severe water logging'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'desmodium',
        name: 'Desmodium',
        altitude: 'N/A',
        maturity: '90-120 days',
        yield: '150-300 bales/acre',
        attributes: ['High crude protein levels', 'Rich in minerals and vitamins', 'Improve soil fertility through nitrogen fixation', 'Stops Striga weed growth on farms'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'lucerne',
        name: 'Lucerne',
        altitude: 'N/A',
        maturity: '90-120 days',
        yield: '1000-3000 bales/acre',
        attributes: ['Very palatable, nutritious and can sustain high milk production levels when fed to dairy cattle', 'Can last up to four years under good management'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'sudangrass',
        name: 'Sudangrass',
        altitude: 'N/A',
        maturity: '90 days',
        yield: '3 cuttings per year',
        attributes: ['A quick growing annual with smaller stems and thin leaves', 'Very palatable though with relatively low production potential', 'Useful as a dry weather feed'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'columbus-grass',
        name: 'Columbus Grass',
        altitude: 'N/A',
        maturity: '90 days',
        yield: '3 cuttings per year',
        attributes: ['A slow growing biannual crop with broader leaves which under good management can be cut for two consecutive years without reduction in palatability'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'oats',
        name: 'Oats',
        altitude: 'N/A',
        maturity: '135 days',
        yield: '150-250 bales/acre',
        attributes: ['Suitable for forage and grain milling', 'Tolerant to stem rust'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  rice: {
    'nerica-rice-seed-varieties': [
      {
        id: 'nerica-1',
        name: 'NERICA 1',
        altitude: '0-1800m',
        maturity: '100-115 days',
        yield: '4.5 tonnes/ha',
        attributes: ['Aromatic', 'Medium tolerance to blast', 'Good tolerance to lodging', 'Long grains'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'nerica-4',
        name: 'NERICA 4',
        altitude: '0-1800m',
        maturity: '100-130 days',
        yield: '5 tonnes/ha',
        attributes: ['Medium tolerance to blast', 'Good tolerance to lodging', 'Long grains'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'nerica-10',
        name: 'NERICA 10',
        altitude: '0-1800m',
        maturity: '90-105 days',
        yield: '6 tonnes/ha',
        attributes: ['Early maturing', 'Long grains', 'Good tolerance to blast', 'Moderate tolerance to lodging'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'nerica-11',
        name: 'NERICA 11',
        altitude: '0-1800m',
        maturity: '130 days',
        yield: '7 tonnes/ha',
        attributes: ['Long grains', 'Good tolerance to blast', 'Moderate tolerance to lodging'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  sorghum: {
    'sorghum-seed-varieties': [
      {
        id: 'serena-sorghum',
        name: 'Serena Sorghum',
        altitude: 'N/A',
        maturity: '3-4 months',
        yield: '12 bags/acre',
        attributes: ['Brown grain type', 'Tall plant with good root system', 'Fairly tolerant to common sorghum diseases', 'Performs well in mid altitude region and the semi-arid lowland'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'seredo-sorghum',
        name: 'Seredo Sorghum',
        altitude: 'N/A',
        maturity: '3-4 months',
        yield: '12 bags/acre',
        attributes: ['Brown grain type', 'Tall with good tolerance to lodging', 'Widely adaptable'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'gadam-sorghum',
        name: 'Gadam Sorghum',
        altitude: 'N/A',
        maturity: '3 months',
        yield: '8 bags/acre',
        attributes: ['White grain colour', 'Tolerant to common sorghum diseases and pests', 'Has excellent malting qualities', 'Performs well in the coastal strip and semi-arid areas'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'sorghum-e-1291',
        name: 'Sorghum E 1291',
        altitude: 'N/A',
        maturity: '5 months',
        yield: '15-20 bags/acre',
        attributes: ['Brown grain type', 'Dual purpose variety with good malting and milling quality', 'Widely adaptable'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  sunflower: {
    'sunflower-seed-varieties': [
      {
        id: 'h-8998',
        name: 'H 8998',
        altitude: 'N/A',
        maturity: '4 months',
        yield: '12 bags/acre',
        attributes: ['High oil content', 'Uniform in plant height and maturity', 'Excellent tolerance to diseases'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'kenya-fedha',
        name: 'Kenya Fedha',
        altitude: 'N/A',
        maturity: '4-5 months',
        yield: '10-12 bags/acre',
        attributes: ['High oil content', 'Suited to medium to high altitude areas'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'hungarian-white',
        name: 'Hungarian White',
        altitude: 'N/A',
        maturity: '5-6 months',
        yield: '15 bags/acre',
        attributes: ['Long white grains for bird feed', 'Average oil content', 'Open-pollinated variety'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  wheat: {
    'hybrid-wheat-varieties': [
      {
        id: 'ks-farasi',
        name: 'KS Farasi',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '119 days',
        yield: '10-22 bags/acre',
        attributes: ['Tolerant to most foliar diseases', 'Good baking quality', 'High yielding', 'Hard red wheat that is highly recommended for Mount Kenya, Samburu, Laikipia West, Narok, Subukia, Rongai, Nyandarua, Nakuru, Trans-Nzoia, Kericho, Bomet and Uasin-Gishu areas'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-chui',
        name: 'KS Chui',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '120 days',
        yield: '15-31 bags/acre',
        attributes: ['Good tolerance to foliar diseases', 'Adapted to high potential and marginal environments', 'High tillering ability high yields', 'Hard red wheat'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-simba',
        name: 'KS Simba',
        altitude: '1500-2400 m.a.s.l.',
        maturity: '116-120 days',
        yield: '10-22 bags/acre',
        attributes: ['Good baking qualities', 'Suitable for both marginal and high potential areas of Samburu, Laikipia West, Narok, Subukia, Rongai, Nyandarua, Nakuru, Trans-Nzoia, Kericho, Bomet and Uasin-Gishu', 'Hard red wheat', 'Good tillering ability'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-mwamba',
        name: 'KS Mwamba',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '120-130 days',
        yield: '9-25 bags/acre',
        attributes: ['Widely adapted to East Africa conditions (especially in Trans-Nzoia, Uasin-Gishu, Laikipia, Narok and Mt. Kenya areas)', 'Tolerant to field stress conditions', 'High yielding', 'Wide adaptability', 'Tolerant to stem, ear and yellow rust', 'Tolerant to lodging and sprouting'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-ndume',
        name: 'KS Ndume',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '100-110 days',
        yield: '12-31 bags/acre',
        attributes: ['High yielding', 'Good tillering ability', 'Resistant to sprouting and lodging', 'Tolerant to foliar diseases', 'Good baking qualities'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-nyota',
        name: 'KS Nyota',
        altitude: '1800-2500 m.a.s.l.',
        maturity: '120-130 days',
        yield: '12-31 bags/acre',
        attributes: ['Newly released with moderate resistance to stem rust Ug99', 'High yielding', 'Good tillering ability', 'Bred for sprouting tolerance', 'Makes a very stable dough'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'ks-kanga',
        name: 'KS Kanga',
        altitude: '1800-2500 m.a.s.l.',
        maturity: '120-130 days',
        yield: '22-36 bags/acre',
        attributes: ['Product of KSCo-CIMMYT collaboration', 'Newly released with adult plant resistance to stem rust Ug99 (slow rusting)', 'Tolerant to most foliar diseases', 'Good tillering ability', 'Good baking and milling qualities'],
        featured: true,
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'fahari',
        name: 'Fahari',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '122 days',
        yield: '18-26 bags/acre',
        attributes: ['Tolerance to stem rust but poor to ear and yellow rust', 'Good tolerance to lodging but fairly to sprouting'],
        status: 'active',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'kwale',
        name: 'Kwale',
        altitude: '1800-2400 m.a.s.l.',
        maturity: '145 days',
        yield: '20-22 bags/acre',
        attributes: ['High yielding', 'Has good density', 'Suitable for mid to high altitude', 'Good tolerance to stem, ear and yellow rust', 'Fair tolerance to lodging but good to sprouting'],
        status: 'active',
        lastUpdated: '2024-01-15'
      }
    ]
  }
};

// Function to get varieties for a product type and category
const getVarietiesForProduct = (productType: string, categorySlug: string): ProductVariety[] => {
  console.log('getVarietiesForProduct called with:', { productType, categorySlug });
  console.log('Available product types:', Object.keys(productVarietiesData));
  console.log('Available categories for', productType, ':', productVarietiesData[productType] ? Object.keys(productVarietiesData[productType]) : 'No data for this product type');
  
  const result = productVarietiesData[productType]?.[categorySlug] || [];
  console.log('Returning varieties:', result);
  return result;
};

const ProductVarieties: React.FC = () => {
  const { productType, categorySlug } = useParams<{ productType: string; categorySlug: string }>();
  const navigate = useNavigate();
  
  console.log('ProductVarieties component loaded with params:', { productType, categorySlug });
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingVariety, setEditingVariety] = React.useState<ProductVariety | null>(null);
  const [varieties, setVarieties] = React.useState<ProductVariety[]>([]);
  
  // Image management state
  const [openImageDialog, setOpenImageDialog] = React.useState(false);
  const [editingImageVariety, setEditingImageVariety] = React.useState<ProductVariety | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);

  const handleEditVariety = (variety: ProductVariety) => {
    setEditingVariety(variety);
    setOpenDialog(true);
  };

  const handleDeleteVariety = async (varietyId: string) => {
    if (window.confirm('Are you sure you want to delete this variety?')) {
      try {
        // Delete from database
        await deleteVariety(parseInt(varietyId));
        
        // Remove from local state
        setVarieties(prev => prev.filter(v => v.id !== varietyId));
        
        alert('Variety deleted successfully from database!');
      } catch (error) {
        console.error('Error deleting variety from database:', error);
        alert('Error deleting variety from database. Please try again.');
      }
    }
  };

  const handleViewVariety = (varietyId: string) => {
    const variety = varieties.find(v => v.id === varietyId);
    if (variety) {
      alert(`Variety: ${variety.name}\nAltitude: ${variety.altitude}\nMaturity: ${variety.maturity}\nYield: ${variety.yield}`);
    }
  };

  const handleAddVariety = () => {
    setEditingVariety({
      id: '',
      name: '', 
      altitude: '',
      maturity: '', 
      yield: '', 
      attributes: [],
      status: 'active',
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVariety(null);
  };

  const handleSaveVariety = async () => {
    if (editingVariety && productType && categorySlug) {
      try {
        // Get the category ID from database
        const category = await getCategory(productType, categorySlug);
        if (!category) {
          alert('Category not found');
          return;
        }
        const categoryId = category.id;

        const varietyData = {
          category_id: parseInt(categoryId),
          name: editingVariety.name,
          slug: editingVariety.name.toLowerCase().replace(/\s+/g, '-'),
          altitude: editingVariety.altitude,
          maturity: editingVariety.maturity,
          yield: editingVariety.yield,
          attributes: editingVariety.attributes,
          featured: editingVariety.featured || false,
          last_updated: new Date().toISOString().split('T')[0],
          status: 'active'
        };

        // Save to database
        const savedVariety = await createOrUpdateVariety(varietyData);
        
        if (editingVariety.id) {
          // Update existing variety in local state
          setVarieties(prev => prev.map(v => v.id === editingVariety.id ? { ...editingVariety, ...savedVariety } : v));
        } else {
          // Add new variety to local state
          const newVariety = {
            ...editingVariety,
            id: savedVariety.id.toString(),
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'active' as const
          };
          setVarieties(prev => [...prev, newVariety]);
        }
        
        alert('Variety saved successfully to database!');
        handleCloseDialog();
      } catch (error) {
        console.error('Error saving variety to database:', error);
        alert('Error saving variety to database. Please try again.');
      }
    }
  };

  // Image management functions
  const handleEditImage = (varietyId: string) => {
    const variety = varieties.find(v => v.id === varietyId);
    if (variety) {
      setEditingImageVariety(variety);
      setImagePreview(variety.imageData || null);
      setSelectedImageFile(null);
      setOpenImageDialog(true);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async () => {
    if (!editingImageVariety || !selectedImageFile) return;

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        // Save to database as primary storage
        await saveImageToDatabase({
          id: editingImageVariety.id,
          productId: editingImageVariety.id,
          imageData: imageData,
          fileName: selectedImageFile.name,
          fileSize: selectedImageFile.size,
          mimeType: selectedImageFile.type,
          uploadedAt: new Date().toISOString(),
          localPath: `/images/varieties/${editingImageVariety.id}/${selectedImageFile.name}`
        });
        
        // Update local state to reflect database changes
        setVarieties(prev => prev.map(v => 
          v.id === editingImageVariety.id 
            ? { ...v, imageData, imageFile: selectedImageFile }
            : v
        ));

        // Show success message
        alert('Image saved successfully to database!');
        setOpenImageDialog(false);
        setEditingImageVariety(null);
        setImagePreview(null);
        setSelectedImageFile(null);
      };
      reader.readAsDataURL(selectedImageFile);
    } catch (error) {
      console.error('Error saving image to database:', error);
      alert('Error saving image to database. Please try again.');
    }
  };

  const handleDeleteImage = async () => {
    if (!editingImageVariety) return;

    try {
      // Delete from database as primary action
      await deleteImage(editingImageVariety.id, editingImageVariety.imageData);
      
      // Update local state to reflect database changes
      setVarieties(prev => prev.map(v => 
        v.id === editingImageVariety.id 
          ? { ...v, imageData: undefined, imageFile: undefined }
          : v
      ));

      // Show success message
      alert('Image deleted successfully from database!');
      setOpenImageDialog(false);
      setEditingImageVariety(null);
      setImagePreview(null);
      setSelectedImageFile(null);
    } catch (error) {
      console.error('Error deleting image from database:', error);
      alert('Error deleting image from database. Please try again.');
    }
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setEditingImageVariety(null);
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  // Load varieties from database
  React.useEffect(() => {
    const loadVarietiesFromDatabase = async () => {
      if (productType && categorySlug) {
        try {
          console.log('Loading varieties from database for:', { productType, categorySlug });
          const dbVarieties = await getVarieties(productType, categorySlug);
          console.log('Found varieties from database:', dbVarieties);
          
          // Convert database format to frontend format
          const formattedVarieties = dbVarieties.map((variety: any) => ({
            id: variety.id.toString(),
            name: variety.name,
            altitude: variety.altitude || 'N/A',
            maturity: variety.maturity || 'N/A',
            yield: variety.yield || 'N/A',
            attributes: variety.attributes || [],
            featured: variety.featured || false,
            status: variety.status || 'active',
            lastUpdated: variety.last_updated || new Date().toISOString().split('T')[0],
            imageData: variety.image_data ? `data:${variety.image_mime_type};base64,${Buffer.from(variety.image_data).toString('base64')}` : undefined
          }));
          
          setVarieties(formattedVarieties);
        } catch (error) {
          console.error('Error loading varieties from database:', error);
          // Fallback to static data if database fails
          const productVarieties = getVarietiesForProduct(productType, categorySlug);
          setVarieties(productVarieties);
        }
      }
    };

    loadVarietiesFromDatabase();
  }, [productType, categorySlug]);

  // Load images from database as primary source when varieties change
  React.useEffect(() => {
    if (varieties.length === 0) return; // Don't run if no varieties loaded yet
    
    const loadImagesFromDatabase = async () => {
      try {
        const varietyIds = varieties.map(v => v.id);
        const imageMap = await loadProductImages(varietyIds);
        
        // Update varieties with database image data (primary source)
        setVarieties(prev => prev.map(variety => {
          const dbImageData = imageMap.get(variety.id);
          if (dbImageData) {
            // Database is primary source - use database image data
            return {
              ...variety,
              imageData: dbImageData.imageData
            };
          }
          // No database image - keep original variety data
          return variety;
        }));
      } catch (error) {
        console.error('Error loading images from database:', error);
        // Fallback: continue with original variety data if database fails
      }
    };
    loadImagesFromDatabase();
  }, [varieties.length]); // Run when varieties are loaded

  const handleBack = () => {
    navigate(`/products/${productType}/categories`);
  };

    return (
      <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/products')}
          sx={{ textDecoration: 'none' }}
        >
          Products
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
          sx={{ textDecoration: 'none' }}
        >
          {productType?.charAt(0).toUpperCase()}{productType?.slice(1)} Categories
        </Link>
        <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>
          {categorySlug?.replace(/-/g, ' ')} Varieties
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {categorySlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Varieties
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage individual varieties for {categorySlug?.replace(/-/g, ' ')}. Click "Edit" to modify variety details or "Manage Image" to edit images.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddVariety}
          sx={{ ml: 2 }}
        >
          Add Variety
        </Button>
      </Box>

      {/* Varieties Display - Cards for Horticulture, Table for Maize */}
      {productType === 'horticulture' ? (
        // Card Layout for Horticulture
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {varieties.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No varieties found for {productType} - {categorySlug}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Check console for debugging information
                </Typography>
              </Box>
            </Grid>
          ) : (
            varieties.map((variety) => (
              <Grid item xs={12} sm={6} md={4} key={variety.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Variety Image */}
                  {variety.imageData ? (
                <CardMedia
                  component="img"
                  height="200"
                      image={variety.imageData}
                  alt={variety.name}
                      sx={{ objectFit: 'cover' }}
                />
              ) : (
                    <Box
                      sx={{
                        height: 200,
                        background: `linear-gradient(135deg, ${variety.featured ? '#4CAF50' : '#2196F3'}, ${variety.featured ? '#2E7D32' : '#1976D2'})`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                        color: 'white',
                        fontSize: '48px',
                        fontWeight: 'bold'
                      }}
                    >
                      {variety.name.charAt(0)}
                </Box>
              )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {variety.name}
                      </Typography>
                {variety.featured && (
                  <Chip 
                    label="Featured" 
                    size="small" 
                          color="primary"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Maturity:</strong> {variety.maturity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Yield:</strong> {variety.yield}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Altitude:</strong> {variety.altitude}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Key Attributes:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {variety.attributes.slice(0, 3).map((attr, index) => (
                <Chip 
                            key={index}
                            label={attr}
                  size="small" 
                            variant="outlined"
                          />
                        ))}
                        {variety.attributes.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{variety.attributes.length - 3} more
                          </Typography>
                        )}
              </Box>
            </Box>
            
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={variety.status}
                        color={variety.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {variety.lastUpdated}
              </Typography>
              </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      <Tooltip title="Edit Image">
                        <IconButton
                          size="small"
                          onClick={() => handleEditImage(variety.id)}
                          sx={{ color: variety.imageData ? 'primary.main' : 'text.secondary' }}
                        >
                          <CameraIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                  onClick={() => handleEditVariety(variety)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box>
                      <Tooltip title="View">
                  <IconButton
                          size="small"
                          onClick={() => handleViewVariety(variety.id)}
                          color="info"
                  >
                          <ViewIcon />
                  </IconButton>
                </Tooltip>
                      <Tooltip title="Delete">
                  <IconButton
                          size="small"
                    onClick={() => handleDeleteVariety(variety.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
                  </CardActions>
          </Card>
        </Grid>
            ))
          )}
    </Grid>
      ) : (
        // Table Layout for Maize and other products
        <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
              <TableCell>Variety</TableCell>
              <TableCell>Altitude</TableCell>
            <TableCell>Maturity</TableCell>
            <TableCell>Yield</TableCell>
              <TableCell>Attributes</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            {varieties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No varieties found for {productType} - {categorySlug}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Check console for debugging information
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              varieties.map((variety) => (
              <TableRow key={variety.id} hover>
              <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Variety Image or Avatar */}
                    {variety.imageData ? (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundImage: `url(${variety.imageData})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          mr: 2,
                          border: '2px solid',
                          borderColor: variety.featured ? '#4CAF50' : '#2196F3'
                    }}
                  />
                ) : (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${variety.featured ? '#4CAF50' : '#2196F3'}, ${variety.featured ? '#2E7D32' : '#1976D2'})`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                          mr: 2,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}
                      >
                        {variety.name.charAt(0)}
                  </Box>
                )}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {variety.name}
                      </Typography>
                      {variety.featured && (
                        <Chip
                          label="Featured"
                          size="small"
                          color="primary"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
              </TableCell>
                <TableCell>{variety.altitude}</TableCell>
                <TableCell>{variety.maturity}</TableCell>
              <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {variety.yield}
                </Typography>
              </TableCell>
              <TableCell>
                  <Box sx={{ maxWidth: 200 }}>
                    {variety.attributes.slice(0, 2).map((attribute, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        display="block"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        • {attribute}
                      </Typography>
                    ))}
                    {variety.attributes.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{variety.attributes.length - 2} more
                      </Typography>
                    )}
                  </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={variety.status} 
                  color={variety.status === 'active' ? 'success' : 'default'}
                    size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                        onClick={() => handleEditVariety(variety)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                    <Tooltip title="Manage Image">
                      <IconButton
                        size="small"
                        onClick={() => handleEditImage(variety.id)}
                        sx={{ color: variety.imageData ? 'primary.main' : 'text.secondary' }}
                      >
                        <CameraIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handleViewVariety(variety.id)}
                      >
                        <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                        size="small"
                      onClick={() => handleDeleteVariety(variety.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
              ))
            )}
        </TableBody>
      </Table>
    </TableContainer>
      )}

      {/* Edit/Add Variety Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVariety ? 'Edit Variety' : 'Add New Variety'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Variety Name"
                value={editingVariety?.name || ''}
                onChange={(e) => setEditingVariety(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Altitude"
                value={editingVariety?.altitude || ''}
                onChange={(e) => setEditingVariety(prev => prev ? { ...prev, altitude: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maturity"
                value={editingVariety?.maturity || ''}
                onChange={(e) => setEditingVariety(prev => prev ? { ...prev, maturity: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Yield"
                value={editingVariety?.yield || ''}
                onChange={(e) => setEditingVariety(prev => prev ? { ...prev, yield: e.target.value } : null)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Attributes (one per line)"
                multiline
                rows={4}
                value={editingVariety?.attributes.join('\n') || ''}
                onChange={(e) => setEditingVariety(prev => prev ? { ...prev, attributes: e.target.value.split('\n').filter(attr => attr.trim()) } : null)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingVariety?.status || 'active'}
                  onChange={(e) => setEditingVariety(prev => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : null)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <input
                  type="checkbox"
                  checked={editingVariety?.featured || false}
                  onChange={(e) => setEditingVariety(prev => prev ? { ...prev, featured: e.target.checked } : null)}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Featured Variety
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveVariety} variant="contained">
            {editingVariety ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog} maxWidth="sm" fullWidth disableEnforceFocus>
        <DialogTitle>
          Manage Image - {editingImageVariety?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Current Image Preview */}
            {editingImageVariety?.imageData && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Image:
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    backgroundImage: `url(${editingImageVariety.imageData})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb'
                  }}
                />
              </Box>
            )}

            {/* New Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload New Image:
              </Typography>
                <input
                  type="file"
                  accept="image/*"
                onChange={handleImageFileChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Choose Image
              </Button>
              </label>
              
              {/* New Image Preview */}
              {imagePreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    backgroundImage: `url(${imagePreview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    mt: 2
                  }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteImageIcon />}
            onClick={handleDeleteImage}
            disabled={!editingImageVariety?.imageData}
          >
            Delete Image
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveImage}
            disabled={!selectedImageFile}
            startIcon={<UploadIcon />}
          >
            Save Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductVarieties;