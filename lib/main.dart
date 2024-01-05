import 'package:flutter/material.dart';
import 'package:sleek_circular_slider/sleek_circular_slider.dart';



void main() {
  runApp(Zealot());
}

class Zealot extends StatelessWidget {
  const Zealot({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        primarySwatch: Colors.blueGrey,
      ),
      debugShowCheckedModeBanner: false,
      home: SplitSliderView(),
    );
  }
}

class SplitSliderView extends StatelessWidget{
  const SplitSliderView({super.key});

  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(
        title: Text('Dual Partial Slider Example'),
      ),
      body: Center( 
        child: Stack(
          children: [
            Container(
              height: 200,
              width: 200,
              color: Colors.red,
              child: SleekCircularSlider(
                initialValue: 0,
                max: 100,
                appearance: CircularSliderAppearance(
                  customColors: CustomSliderColors(
                    progressBarColor: Color(0xFFF71735),
                    trackColor: Colors.grey,
                  ),
                  customWidths: CustomSliderWidths(
                    progressBarWidth: 14,
                    trackWidth: 10,
                    shadowWidth: 16,
                  ),
                  startAngle: 110,
                  angleRange: 120,
                  spinnerMode: false,
                  animationEnabled: true,
                  counterClockwise: false,
                ),
                onChange: (double value) {
                  //Requests can be handled here. 
                },
              ),
            ),
            PartialSliderWidget(),
          ],
        ),
      ),
    );
  }
}


class PartialSliderWidget extends StatelessWidget {
  const PartialSliderWidget({super.key});

  @override
  Widget build(BuildContext context){
    return Container(
      height: 200,
      width: 200,

      child: SleekCircularSlider(
        initialValue: 0,
        max: 100,
        appearance: CircularSliderAppearance(
          customColors: CustomSliderColors(
            progressBarColor: Color(0xFF00bcb5),
            trackColor: Colors.grey,
          ),
          customWidths: CustomSliderWidths(
            progressBarWidth: 14,
            trackWidth: 10,
            shadowWidth: 16,
          ),
          startAngle: 70,
          angleRange: 120,
          spinnerMode: false,
          animationEnabled: true,
          counterClockwise: true,
        ),
        onChange: (double value) {
          //Requests can be handled here. 
        },
      ),
    );
  }
}